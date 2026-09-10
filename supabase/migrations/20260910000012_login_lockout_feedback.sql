-- Ajuste de UX pedido depois do teste real do bloqueio (item §49 nº 12): a
-- tela de login mostrava só "tente novamente em alguns minutos", sem dizer
-- quanto tempo falta, e não avisava o usuário de que tentativas erradas
-- estavam sendo contadas. register_login_attempt passa a devolver jsonb com
-- locked_until (pro contador regressivo) e attempts_remaining (pro aviso
-- "restam N tentativas").

drop function if exists register_login_attempt(text, boolean);

create or replace function register_login_attempt(p_email text, p_success boolean)
returns jsonb
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
  v_failed_count integer;
begin
  if p_success then
    delete from public.login_lockout where email = v_email;
    return jsonb_build_object('locked_until', null, 'attempts_remaining', null);
  end if;

  select * into v_row from public.login_lockout where email = v_email for update;

  if v_row is null then
    insert into public.login_lockout (email, failed_count, last_attempt_at)
    values (v_email, 1, now());
    return jsonb_build_object(
      'locked_until', null,
      'attempts_remaining', v_threshold - 1
    );
  end if;

  if v_row.last_attempt_at < now() - v_window then
    update public.login_lockout
      set failed_count = 1, last_attempt_at = now(), locked_until = null
      where email = v_email;
    return jsonb_build_object(
      'locked_until', null,
      'attempts_remaining', v_threshold - 1
    );
  end if;

  if v_row.failed_count + 1 >= v_threshold then
    update public.login_lockout
      set failed_count = 0, last_attempt_at = now(), locked_until = now() + v_lock_duration
      where email = v_email
      returning locked_until into v_locked_until;
    return jsonb_build_object('locked_until', v_locked_until, 'attempts_remaining', 0);
  end if;

  update public.login_lockout
    set failed_count = failed_count + 1, last_attempt_at = now()
    where email = v_email
    returning failed_count into v_failed_count;
  return jsonb_build_object(
    'locked_until', null,
    'attempts_remaining', v_threshold - v_failed_count
  );
end;
$$;

revoke execute on function register_login_attempt(text, boolean) from public;
grant execute on function register_login_attempt(text, boolean) to anon, authenticated;
