-- Item §49 nº 10: Angela decidiu estender a retenção do próprio audit_log
-- de 12 meses para 3 anos, alinhando com o prazo de responsabilidade civil
-- do art. 206, §3º, V do Código Civil — período em que o log pode ser
-- necessário como prova em eventual disputa. Só troca o intervalo da
-- trigger já existente (purge_old_audit_log, de 20260909000009); nada mais
-- muda na tabela.

create or replace function purge_old_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.audit_log where created_at < now() - interval '3 years';
  return null;
end;
$$;
