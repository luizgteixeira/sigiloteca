-- Log de auditoria: registra eventos sensíveis (login, logout, criação,
-- alteração e exclusão de documento/cliente, exportação) por workspace.
-- Cobre a lacuna identificada no Procedimento de Incidentes de Segurança
-- do Sigiloteca — hoje só existiam os logs nativos do Supabase, sem
-- registro próprio de quem fez o quê dentro da aplicação.
--
-- Só permite INSERT pra quem tem sessão própria (user_id = auth.uid()) e
-- SELECT restrito ao dono do workspace — não há policy de UPDATE/DELETE,
-- então nenhum usuário autenticado consegue alterar ou apagar entradas já
-- gravadas (mesmo espírito das guardas de retenção: proteção no banco,
-- não só na aplicação).

create type audit_action as enum (
  'login',
  'logout',
  'document_create',
  'document_update',
  'document_delete',
  'document_export',
  'client_create',
  'client_update',
  'client_delete'
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  action audit_action not null,
  resource_type text,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_workspace_created_idx
  on audit_log (workspace_id, created_at desc);

alter table audit_log enable row level security;

create policy "audit_log: read via own workspace"
  on audit_log for select
  using (
    exists (
      select 1 from workspace
      where workspace.id = audit_log.workspace_id
        and workspace.owner_id = auth.uid()
    )
  );

create policy "audit_log: insert own events"
  on audit_log for insert
  with check (user_id = auth.uid());
