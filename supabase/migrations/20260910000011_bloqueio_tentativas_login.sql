-- Bloqueio por tentativas de login (item §49 nº 12). Sem isso, o app confiava
-- só no rate limit nativo do GoTrue (Supabase Auth), que é por IP/global do
-- projeto, não por conta — não protege uma conta específica de brute force
-- vindo de IPs variados.
--
-- Contagem por e-mail (não por IP): 5 tentativas falhas em 15 minutos bloqueia
-- a conta por 15 minutos. Login bem-sucedido zera o contador. Fica numa
-- tabela própria, sem policy de RLS pra authenticated/anon (acesso só via as
-- duas funções abaixo, security definer) — mesmo padrão de "proteção no
-- banco, não só na aplicação" já usado nas guardas de retenção.

create table login_lockout (
  email text primary key,
  failed_count integer not null default 0,
  locked_until timestamptz,
  last_attempt_at timestamptz not null default now()
);

alter table login_lockout enable row level security;

create or replace function check_login_lockout(p_email text)
returns timestamptz
language sql
security definer
set search_path = ''
stable
as $$
  select locked_until
  from public.login_lockout
  where email = lower(trim(p_email))
    and locked_until > now();
$$;

create or replace function register_login_attempt(p_email text, p_success boolean)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_row public.login_lockout;
  v_threshold constant integer := 5;
  v_window constant interval := interval '15 minutes';
  v_lock_duration constant interval := interval '15 minutes';
  v_locked_until timestamptz;
begin
  if p_success then
    delete from public.login_lockout where email = v_email;
    return null;
  end if;

  select * into v_row from public.login_lockout where email = v_email for update;

  if v_row is null then
    insert into public.login_lockout (email, failed_count, last_attempt_at)
    values (v_email, 1, now());
    return null;
  end if;

  if v_row.last_attempt_at < now() - v_window then
    update public.login_lockout
      set failed_count = 1, last_attempt_at = now(), locked_until = null
      where email = v_email;
    return null;
  end if;

  if v_row.failed_count + 1 >= v_threshold then
    update public.login_lockout
      set failed_count = 0, last_attempt_at = now(), locked_until = now() + v_lock_duration
      where email = v_email
      returning locked_until into v_locked_until;
    return v_locked_until;
  end if;

  update public.login_lockout
    set failed_count = failed_count + 1, last_attempt_at = now()
    where email = v_email;
  return null;
end;
$$;

-- Chamadas antes do login (usuário ainda não autenticado) e durante o
-- próprio login — role anon/authenticated precisa de EXECUTE explícito,
-- já que funções não herdam RLS mas ainda exigem grant.
revoke execute on function check_login_lockout(text) from public;
revoke execute on function register_login_attempt(text, boolean) from public;
grant execute on function check_login_lockout(text) to anon, authenticated;
grant execute on function register_login_attempt(text, boolean) to anon, authenticated;
