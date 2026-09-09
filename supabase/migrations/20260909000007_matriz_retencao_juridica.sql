-- Traduz a Matriz Jurídica de Retenção (Angela, 09/09/2026 — ver vault
-- Obsidian "Matriz Jurídica de Retenção (Preenchida)") em modelo de dados:
-- toda retenção com prazo fixo precisa vir com o fundamento jurídico que a
-- justifica (o sistema não presume sozinho qual prazo/motivo se aplica), e
-- um documento pode ficar sob preservação especial (Legal Hold) — que
-- bloqueia exclusão independente do prazo normal e, como a retenção comum,
-- só pode ser revertida com acesso direto ao banco, não pela aplicação.

create type retention_basis as enum (
  'active_purpose',
  'legal_obligation',
  'rights_defense',
  'professional_record',
  'security_audit',
  'litigation_hold',
  'archival'
);

alter table documento
  add column retention_basis retention_basis,
  add column legal_hold boolean not null default false;

alter table documento
  add constraint documento_retention_basis_check
  check (retention_until is null or retention_basis is not null);

create index documento_legal_hold_idx
  on documento (workspace_id)
  where legal_hold;

-- Redefine as guardas de retenção (20260826000005) incluindo o legal_hold.

create or replace function enforce_documento_retention()
returns trigger
language plpgsql
security definer
set search_path = public
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

create or replace function enforce_documento_storage_retention()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.bucket_id <> 'documentos' then
    return old;
  end if;

  if exists (
    select 1 from documento
    where storage_path = old.name
      and (
        (retention_until is not null and retention_until > now())
        or legal_hold
      )
  ) then
    raise exception 'Arquivo retido ou sob preservação especial. Exclusão bloqueada.';
  end if;

  if exists (
    select 1
    from documento_versao dv
    join documento d on d.id = dv.documento_id
    where dv.storage_path = old.name
      and (
        (d.retention_until is not null and d.retention_until > now())
        or d.legal_hold
      )
  ) then
    raise exception 'Arquivo retido ou sob preservação especial. Exclusão bloqueada.';
  end if;

  return old;
end;
$$;
