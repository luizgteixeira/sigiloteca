-- Formulário dedicado para titulares (item §49 nº 22) — canal pra qualquer
-- pessoa cujo dado pessoal o escritório trate (cliente cadastrado ou não;
-- ex: parte contrária, testemunha) exercer os direitos do art. 18 da LGPD.
--
-- Sem workspace_id de propósito: hoje o Sigiloteca serve um único
-- escritório por instalação (multiusuário/multi-tenant está fora de escopo
-- nesta fase, ver README) — não faz sentido pedir pro titular anônimo
-- escolher um workspace que ele nem sabe que existe. Se multi-tenant virar
-- realidade, esta tabela precisa ser revisitada then.
--
-- RLS: qualquer um (mesmo anônimo) pode INSERT — é a própria função do
-- formulário público. Só usuário autenticado pode ver/atualizar as
-- solicitações (não há tela pública de "acompanhar minha solicitação"
-- nesta fase — o retorno ao titular é manual, pelo canal de contato que
-- ele informou).

create type direito_titular as enum (
  'confirmacao_tratamento',
  'acesso',
  'correcao',
  'anonimizacao_bloqueio_eliminacao',
  'portabilidade',
  'eliminacao_consentimento',
  'informacao_compartilhamento',
  'outro'
);

create type status_solicitacao_titular as enum ('pendente', 'concluida');

create table solicitacao_titular (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  cpf text,
  direito direito_titular not null,
  descricao text,
  status status_solicitacao_titular not null default 'pendente',
  created_at timestamptz not null default now(),
  concluida_em timestamptz
);

create index solicitacao_titular_status_idx
  on solicitacao_titular (status, created_at desc);

alter table solicitacao_titular enable row level security;

create policy "solicitacao_titular: qualquer um pode registrar"
  on solicitacao_titular for insert
  to anon, authenticated
  with check (true);

create policy "solicitacao_titular: só autenticado vê"
  on solicitacao_titular for select
  to authenticated
  using (true);

create policy "solicitacao_titular: só autenticado marca como concluída"
  on solicitacao_titular for update
  to authenticated
  using (true)
  with check (true);
