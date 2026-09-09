-- Duas lacunas do audit_log (20260909000008) resolvidas:
--
-- 1. "Quem" fez a ação: além de user_id, grava o e-mail no momento do
--    evento (denormalizado) — auth.users não é consultável via PostgREST
--    pela role authenticated, e o e-mail registrado na hora do evento
--    continua correto mesmo que a conta seja depois renomeada ou removida.
--
-- 2. Retenção do próprio log: definida em 12 meses (decisão registrada em
--    conversa com o usuário em 09/09/2026). Como audit_log não aceita
--    UPDATE/DELETE de usuário autenticado (de propósito, pra ninguém
--    adulterar/apagar evidência pela aplicação), o expurgo só pode
--    acontecer por um caminho privilegiado — aqui, uma trigger
--    security definer que roda a cada novo evento e apaga o que passou
--    de 12 meses. Sem pg_cron: mais simples, sem depender de extensão
--    habilitada no projeto, mesmo padrão das guardas de retenção de
--    documento (enforce_documento_retention).

alter table audit_log add column user_email text;

create or replace function purge_old_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from audit_log where created_at < now() - interval '12 months';
  return null;
end;
$$;

create trigger audit_log_purge_old
  after insert on audit_log
  for each statement
  execute function purge_old_audit_log();
