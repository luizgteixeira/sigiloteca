-- Cadastro de clientes — permite vincular documento/ofício a um cliente
-- pré-cadastrado via combobox, em vez de digitar o nome livre.
-- documento.cliente continua como snapshot de texto (nome no momento da
-- criação) — não mexe no trigger de busca nem no document-list.
-- documento.cliente_id é o vínculo relacional real.

create table cliente (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspace (id) on delete cascade,
  nome text not null,
  endereco text,
  email text,
  celular text,
  cpf text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cliente_workspace_id_idx on cliente (workspace_id);
create index cliente_workspace_nome_idx on cliente (workspace_id, nome);

-- CPF único por workspace quando informado (índice único parcial — mesmo
-- padrão já usado em documento_oficio_modelo_padrao_uidx no schema inicial)
create unique index cliente_workspace_cpf_uidx
  on cliente (workspace_id, cpf)
  where cpf is not null;

alter table cliente enable row level security;

create policy "cliente: access via own workspace"
  on cliente for all
  using (
    exists (
      select 1 from workspace
      where workspace.id = cliente.workspace_id
        and workspace.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workspace
      where workspace.id = cliente.workspace_id
        and workspace.owner_id = auth.uid()
    )
  );

alter table documento
  add column cliente_id uuid references cliente (id) on delete set null;

create index documento_cliente_id_idx on documento (cliente_id);
