-- Fase 1 de multiusuário: várias pessoas no mesmo escritório (workspace),
-- cada uma com um papel. Até aqui "escritório" era sinônimo de "uma pessoa"
-- (workspace.owner_id); todo o acesso passa a ser por pertencer ao
-- escritório (workspace_membro), e as ações permanentes ficam só com
-- administradores — reforçado aqui no banco, não só na tela.
--
-- Matriz de papéis (espelhada em src/lib/permissoes.ts):
--   administrador — tudo, inclusive equipe, auditoria, exportar, excluir e
--                   anonimizar documentos, excluir clientes
--   advogado      — documentos e clientes (ver, baixar, enviar, editar) e
--                   solicitações de titulares
--   assistente    — documentos e clientes (ver, baixar, enviar, editar)
--
-- workspace.owner_id fica como registro histórico de quem criou o
-- escritório; nenhuma regra de acesso depende mais dele.
--
-- A atribuição dos membros iniciais (quem vira administrador de qual
-- escritório) NÃO está aqui de propósito: o repositório é espelhado
-- publicamente e ela envolve e-mails de pessoas reais. Foi feita direto no
-- banco de produção, registrada no README.

create type papel_membro as enum ('administrador', 'advogado', 'assistente');

create table public.workspace_membro (
  workspace_id uuid not null references public.workspace (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Cópia do e-mail no momento do convite: a tela de equipe precisa listar
  -- os membros e auth.users não é legível pelo cliente.
  email text not null,
  papel papel_membro not null,
  convidado_por uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id),
  -- Fase 1: cada pessoa pertence a um único escritório.
  unique (user_id)
);

alter table public.workspace_membro enable row level security;

-- Funções de apoio às policies. security definer para não cair em recursão
-- de RLS ao consultar workspace_membro de dentro das policies dela mesma.
create or replace function public.eh_membro(p_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_membro
    where workspace_id = p_workspace and user_id = auth.uid()
  );
$$;

create or replace function public.eh_admin(p_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_membro
    where workspace_id = p_workspace
      and user_id = auth.uid()
      and papel = 'administrador'
  );
$$;

-- solicitacao_titular não tem workspace_id (formulário público, um
-- escritório por instalação) — o acesso é por papel em qualquer escritório.
create or replace function public.papel_do_usuario()
returns papel_membro
language sql
stable
security definer
set search_path = ''
as $$
  select papel from public.workspace_membro where user_id = auth.uid() limit 1;
$$;

revoke all on function public.eh_membro(uuid) from public, anon;
revoke all on function public.eh_admin(uuid) from public, anon;
revoke all on function public.papel_do_usuario() from public, anon;
grant execute on function public.eh_membro(uuid) to authenticated;
grant execute on function public.eh_admin(uuid) to authenticated;
grant execute on function public.papel_do_usuario() to authenticated;

-- workspace_membro: membros veem a equipe; administradores trocam papel e
-- removem. Inclusão só pelo servidor (convite usa a service role, que
-- precisa criar o usuário no Auth de qualquer forma).
create policy "workspace_membro: membros veem a equipe"
  on public.workspace_membro for select
  to authenticated
  using (public.eh_membro(workspace_id));

create policy "workspace_membro: admin altera papel"
  on public.workspace_membro for update
  to authenticated
  using (public.eh_admin(workspace_id))
  with check (public.eh_admin(workspace_id));

create policy "workspace_membro: admin remove membro"
  on public.workspace_membro for delete
  to authenticated
  using (public.eh_admin(workspace_id));

-- Nunca deixar um escritório sem administrador (remoção ou rebaixamento do
-- último), nem pela tela nem por chamada direta à API.
create or replace function public.proteger_ultimo_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.papel = 'administrador'
     and (tg_op = 'DELETE' or new.papel <> 'administrador')
     and not exists (
       select 1 from public.workspace_membro
       where workspace_id = old.workspace_id
         and papel = 'administrador'
         and user_id <> old.user_id
     )
     -- Exclusão em cascata do próprio escritório não é bloqueada.
     and exists (select 1 from public.workspace where id = old.workspace_id)
  then
    raise exception 'O escritório precisa de pelo menos um administrador.';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger workspace_membro_ultimo_admin
  before update or delete on public.workspace_membro
  for each row execute function public.proteger_ultimo_admin();

-- workspace
drop policy "workspace: owner has full access" on public.workspace;

create policy "workspace: membros veem"
  on public.workspace for select
  to authenticated
  using (public.eh_membro(id));

create policy "workspace: admin altera"
  on public.workspace for update
  to authenticated
  using (public.eh_admin(id))
  with check (public.eh_admin(id));

-- documento
drop policy "documento: access via own workspace" on public.documento;

create policy "documento: membros veem"
  on public.documento for select
  to authenticated
  using (public.eh_membro(workspace_id));

create policy "documento: membros criam"
  on public.documento for insert
  to authenticated
  with check (public.eh_membro(workspace_id));

create policy "documento: membros alteram"
  on public.documento for update
  to authenticated
  using (public.eh_membro(workspace_id))
  with check (public.eh_membro(workspace_id));

create policy "documento: admin exclui"
  on public.documento for delete
  to authenticated
  using (public.eh_admin(workspace_id));

-- Anonimizar é um UPDATE, então a policy acima não basta: só administrador
-- pode marcar um documento como anonimizado. auth.uid() nulo = contexto de
-- serviço/migração, que não passa por aqui.
create or replace function public.exigir_admin_para_anonimizar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.anonymized and not old.anonymized
     and auth.uid() is not null
     and not public.eh_admin(old.workspace_id)
  then
    raise exception 'Só administradores podem anonimizar documentos.';
  end if;
  return new;
end;
$$;

create trigger documento_anonimizacao_admin
  before update on public.documento
  for each row execute function public.exigir_admin_para_anonimizar();

-- documento_versao
drop policy "documento_versao: access via own workspace" on public.documento_versao;

create policy "documento_versao: membros veem"
  on public.documento_versao for select
  to authenticated
  using (exists (
    select 1 from public.documento d
    where d.id = documento_versao.documento_id
      and public.eh_membro(d.workspace_id)
  ));

create policy "documento_versao: membros criam"
  on public.documento_versao for insert
  to authenticated
  with check (exists (
    select 1 from public.documento d
    where d.id = documento_versao.documento_id
      and public.eh_membro(d.workspace_id)
  ));

create policy "documento_versao: membros alteram"
  on public.documento_versao for update
  to authenticated
  using (exists (
    select 1 from public.documento d
    where d.id = documento_versao.documento_id
      and public.eh_membro(d.workspace_id)
  ))
  with check (exists (
    select 1 from public.documento d
    where d.id = documento_versao.documento_id
      and public.eh_membro(d.workspace_id)
  ));

create policy "documento_versao: admin exclui"
  on public.documento_versao for delete
  to authenticated
  using (exists (
    select 1 from public.documento d
    where d.id = documento_versao.documento_id
      and public.eh_admin(d.workspace_id)
  ));

-- cliente
drop policy "cliente: access via own workspace" on public.cliente;

create policy "cliente: membros veem"
  on public.cliente for select
  to authenticated
  using (public.eh_membro(workspace_id));

create policy "cliente: membros criam"
  on public.cliente for insert
  to authenticated
  with check (public.eh_membro(workspace_id));

create policy "cliente: membros alteram"
  on public.cliente for update
  to authenticated
  using (public.eh_membro(workspace_id))
  with check (public.eh_membro(workspace_id));

create policy "cliente: admin exclui"
  on public.cliente for delete
  to authenticated
  using (public.eh_admin(workspace_id));

-- audit_log: só administrador lê. A inclusão passa a exigir também que o
-- evento seja do escritório de quem grava (antes bastava user_id = o
-- próprio usuário, o que permitiria gravar eventos em outro escritório).
drop policy "audit_log: read via own workspace" on public.audit_log;
drop policy "audit_log: insert own events" on public.audit_log;

create policy "audit_log: admin lê"
  on public.audit_log for select
  to authenticated
  using (public.eh_admin(workspace_id));

create policy "audit_log: membro grava eventos do próprio escritório"
  on public.audit_log for insert
  to authenticated
  with check (user_id = auth.uid() and public.eh_membro(workspace_id));

-- Storage (bucket documentos, primeira pasta do caminho = id do escritório)
drop policy "documentos: select via own workspace" on storage.objects;
drop policy "documentos: insert via own workspace" on storage.objects;
drop policy "documentos: update via own workspace" on storage.objects;
drop policy "documentos: delete via own workspace" on storage.objects;

create policy "documentos: membros leem"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from public.workspace_membro m
      where m.workspace_id::text = (storage.foldername(name))[1]
        and m.user_id = auth.uid()
    )
  );

create policy "documentos: membros enviam"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documentos'
    and exists (
      select 1 from public.workspace_membro m
      where m.workspace_id::text = (storage.foldername(name))[1]
        and m.user_id = auth.uid()
    )
  );

create policy "documentos: membros alteram"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from public.workspace_membro m
      where m.workspace_id::text = (storage.foldername(name))[1]
        and m.user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'documentos'
    and exists (
      select 1 from public.workspace_membro m
      where m.workspace_id::text = (storage.foldername(name))[1]
        and m.user_id = auth.uid()
    )
  );

-- Apagar arquivo: administrador; ou qualquer membro quando o arquivo não
-- pertence a nenhum documento (limpeza de upload cujo cadastro falhou).
create policy "documentos: admin apaga, ou membro apaga arquivo órfão"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from public.workspace_membro m
      where m.workspace_id::text = (storage.foldername(name))[1]
        and m.user_id = auth.uid()
        and (
          m.papel = 'administrador'
          or (
            not exists (select 1 from public.documento d where d.storage_path = objects.name)
            and not exists (select 1 from public.documento_versao v where v.storage_path = objects.name)
          )
        )
    )
  );

-- solicitacao_titular: só administradores e advogados veem e concluem.
drop policy "solicitacao_titular: só autenticado vê" on public.solicitacao_titular;
drop policy "solicitacao_titular: só autenticado marca como concluída" on public.solicitacao_titular;

create policy "solicitacao_titular: admin e advogado veem"
  on public.solicitacao_titular for select
  to authenticated
  using (public.papel_do_usuario() in ('administrador', 'advogado'));

create policy "solicitacao_titular: admin e advogado concluem"
  on public.solicitacao_titular for update
  to authenticated
  using (public.papel_do_usuario() in ('administrador', 'advogado'))
  with check (public.papel_do_usuario() in ('administrador', 'advogado'));

-- Eventos de auditoria da gestão de equipe.
alter type audit_action add value if not exists 'member_invite';
alter type audit_action add value if not exists 'member_role_change';
alter type audit_action add value if not exists 'member_remove';
