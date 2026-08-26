-- A checagem de retenção em src/app/actions/documentos.ts só protege o fluxo
-- do app; um cliente autenticado ainda pode chamar a REST/Storage API do
-- Supabase direto (mesma anon key + sessão) e apagar ou desbloquear um
-- documento retido, já que a RLS de documento/storage.objects só valida
-- posse do workspace. Estas triggers tornam a retenção uma garantia do
-- banco, não só da aplicação.

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

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger documento_retention_guard
  before update or delete on documento
  for each row
  execute function enforce_documento_retention();

-- Bloqueia também a exclusão direta do arquivo em storage.objects,
-- verificando pelo path (documento.storage_path ou documento_versao.storage_path).

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
      and retention_until is not null
      and retention_until > now()
  ) then
    raise exception 'Arquivo retido. Exclusão bloqueada pela política de retenção.';
  end if;

  if exists (
    select 1
    from documento_versao dv
    join documento d on d.id = dv.documento_id
    where dv.storage_path = old.name
      and d.retention_until is not null
      and d.retention_until > now()
  ) then
    raise exception 'Arquivo retido. Exclusão bloqueada pela política de retenção.';
  end if;

  return old;
end;
$$;

create trigger storage_documento_retention_guard
  before delete on storage.objects
  for each row
  execute function enforce_documento_storage_retention();
