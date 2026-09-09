-- Revisão técnica de RLS/Storage (item §49) — achados e correções.
--
-- Achado 1 (corrigido): a trigger de retenção do Storage só cobria DELETE.
-- updateOficioConteudo() faz upload com upsert:true pra editar o conteúdo
-- de um Ofício, e nada — nem o app, nem o banco — impedia sobrescrever o
-- arquivo de um documento retido ou sob legal hold. Adiciona a mesma
-- guarda também pra UPDATE em storage.objects.
--
-- Achado 2 (corrigido): documento_versao não tinha nenhuma proteção —
-- dava pra apagar uma linha de histórico de versão de um documento
-- retido/legal hold direto pela API, sem passar pelas triggers de
-- documento ou storage.objects. Adiciona guarda equivalente.
--
-- Achado 3 (não corrigido, decisão de política, não técnica): a guarda de
-- UPDATE em documento só bloqueia mudar retention_until/retention_policy/
-- legal_hold — outros campos (titulo, categoria, tags etc.) continuam
-- editáveis num documento retido via API direta (hoje não há UI pra isso).
-- Se um documento retido deveria ficar 100% congelado ou só protegido
-- contra exclusão é decisão do escritório, registrada em
-- "Revisão Técnica de RLS e Storage do Sigiloteca.md" no vault.
--
-- Hardening: funções security definer passam a usar search_path = ''
-- com referências de tabela totalmente qualificadas (public.*), em vez de
-- search_path = public — prática recomendada pelo linter de segurança do
-- Supabase pra function security definer, evitando shadowing por objeto
-- criado no schema public.

create or replace function enforce_documento_retention()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.retention_until is not null and old.retention_until > now() then
    if tg_op = 'DELETE' then
      raise exception 'Documento retido até %. Exclusão bloqueada pela política de retenção.', old.retention_until;
    elsif tg_op = 'UPDATE' and (
      new.retention_until is distinct from old.retention_until
      or new.retention_policy is distinct from old.retention_policy
    ) then
      raise exception 'Documento retido até %. Alteração da política de retenção bloqueada enquanto ativa.', old.retention_until;
    end if;
  end if;

  if old.legal_hold then
    if tg_op = 'DELETE' then
      raise exception 'Documento sob preservação especial (legal hold). Exclusão bloqueada.';
    elsif tg_op = 'UPDATE' and new.legal_hold is distinct from old.legal_hold then
      raise exception 'Documento sob preservação especial (legal hold). Liberação exige acesso direto ao banco, não a aplicação.';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- tg_op-aware: usada tanto por BEFORE DELETE quanto por BEFORE UPDATE em
-- storage.objects. Precisa devolver NEW num UPDATE não bloqueado — devolver
-- OLD sempre (como antes) reverteria silenciosamente qualquer upload
-- legítimo de upsert.
create or replace function enforce_documento_storage_retention()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.bucket_id <> 'documentos' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if exists (
    select 1 from public.documento
    where storage_path = old.name
      and (
        (retention_until is not null and retention_until > now())
        or legal_hold
      )
  ) then
    raise exception 'Arquivo retido ou sob preservação especial. Operação bloqueada pela política de retenção.';
  end if;

  if exists (
    select 1
    from public.documento_versao dv
    join public.documento d on d.id = dv.documento_id
    where dv.storage_path = old.name
      and (
        (d.retention_until is not null and d.retention_until > now())
        or d.legal_hold
      )
  ) then
    raise exception 'Arquivo retido ou sob preservação especial. Operação bloqueada pela política de retenção.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger storage_documento_retention_guard_update
  before update on storage.objects
  for each row
  execute function enforce_documento_storage_retention();

create or replace function enforce_documento_versao_retention()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.documento
    where id = old.documento_id
      and (
        (retention_until is not null and retention_until > now())
        or legal_hold
      )
  ) then
    raise exception 'Documento retido ou sob preservação especial. Exclusão do histórico de versões bloqueada.';
  end if;

  return old;
end;
$$;

create trigger documento_versao_retention_guard
  before delete on documento_versao
  for each row
  execute function enforce_documento_versao_retention();

create or replace function purge_old_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.audit_log where created_at < now() - interval '12 months';
  return null;
end;
$$;
