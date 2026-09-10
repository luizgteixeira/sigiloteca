# Sigiloteca

> Sistema de gestão documental para advocacia — começou como ferramenta pessoal (uso individual) e, em 10/09/2026, a cliente (Angela) autorizou formalmente a comercialização do produto para outros escritórios. Nome de trabalho anterior: "Escritório Virtual".

Desenvolvido por Luiz Gustavo — [luizgustavodev.com](https://luizgustavodev.com/)

## O que é

Um "escritório virtual": um lugar único e organizado para petições, modelos de contrato, decisões judiciais, ofícios, documentos de clientes e arquivos grandes/geoespaciais — resolvendo a dificuldade do usuário de manter tudo organizado hoje.

Ideia original: "é como se eu entrasse no meu notebook em uma sala secreta" — acesso rápido, tudo no lugar certo, sem fricção.

## Documentação de referência (fora deste repositório)

Toda a decisão de arquitetura, negociação e a análise jurídica de LGPD/sigilo profissional vivem no cofre do Obsidian, **não** neste repo:

- **Cofre**: `C:\Users\Luiz Gustavo\OneDrive\documentos\Escritório Virtual\Escritório Virtual\`
  - `Index.md` — visão geral do projeto
  - `ADRs\ADR-001 - Escritorio Virtual.md` — **decisão de arquitetura completa** (contexto, opções consideradas, modelo de dados, stack, consequências, checklist de ação)
  - `Proposta Comercial.md` — orçamento fechado com a cliente (R$ 4.641–7.182, tarifa amiga + 15% desconto)
  - `Posicionamento e Concorrência.md` — análise de concorrentes (Projuris ADV, LegalIntellect) e posicionamento pra ir a mercado
  - `Análise Jurídica - Retenção, LGPD e Sigilo Profissional (Angela).md` — análise jurídica completa sobre prescrição, retenção documental, LGPD e sigilo profissional, recebida da cliente; base para a Política de Retenção/Descarte, Matriz Jurídica de Retenção e os outros 13 documentos operacionais do checklist §49
  - `status-execucao-sigiloteca.md` — **status vivo do checklist §49** (o que já foi implementado, o que pode andar sem depender de mais ninguém, e o que ainda espera decisão da Angela)
  - `Contrato com Escritórios do Sigiloteca (Minuta).md`, `Termos de Uso do Sigiloteca.md`, `Política de Privacidade do Sigiloteca.md`, `Política de Retenção e Descarte do Sigiloteca.md`, `Procedimento de Atendimento aos Titulares do Sigiloteca.md`, `Revisão das Normas da OAB Aplicáveis ao Sigiloteca.md` — os documentos operacionais já refletindo as decisões da Angela

Leia o ADR-001 antes de tomar qualquer decisão técnica nova — ele já resolveu vários trade-offs (por quê Next.js + Supabase, por quê dois provedores de storage, etc.) e não faz sentido reabrir essas discussões sem motivo novo. Leia a Análise Jurídica e o status do checklist §49 antes de mexer em qualquer coisa relacionada a retenção, LGPD ou sigilo profissional.

## Status: onde parei

Checklist do ADR-001 (fase inicial, uso individual):

- [x] Validar as categorias iniciais com a cliente
- [x] Logo aprovado pela cliente (conceito "Pilha Organizada")
- [x] Design system (cores + tipografia) definido
- [x] Next.js criado (`create-next-app`, ainda no estado padrão/boilerplate)
- [x] Schema do modelo de dados prototipado em SQL (`supabase/migrations/`) — workspace, documento (com categoria + tags), documento_versao, RLS por workspace_id
- [x] Projeto Supabase criado (`escritorio-virtual`, região São Paulo), migration rodada, `.env.local` preenchido e API confirmada respondendo com RLS ativa
- [x] Upload + categorização + busca básica implementados, migrations aplicadas e testados no navegador (login, upload de documento real, aparece na lista com link de download funcionando)
- [x] Nome definitivo validado e aplicado: **Sigiloteca** (repositório no GitHub, pasta local, `package.json`, título do app e tela de login, wordmark dos lockups — tudo renomeado e consistente)
- [x] Favicon real gerado a partir da marca (`brand/favicon.ico`, substituiu o placeholder padrão do `create-next-app`) + exports em PNG do ícone e dos lockups em `brand/png/`
- [x] Criar o modelo padrão de Ofício e a ação "Novo a partir deste modelo" — cópia no Storage e versão inicial registrada em `documento_versao`
- [x] Adicionar botão "Exportar tudo" (.zip) para backup local sob demanda — inclui os arquivos do Storage e um `manifest.json` com os metadados
- [x] Controles mínimos de segurança — autenticação, RLS por workspace, Storage privado, exportação autenticada, exclusão confirmada e política de retenção (bloqueada tanto no app quanto no banco, via triggers)
- [x] Deploy em produção: **sigiloteca.com.br** hospedado na Hostinger (plano Business, Node.js/Web Apps), deploy automático a cada push na branch `main` do repositório GitHub `luizgteixeira/sigiloteca-prod`
- [x] Auditoria de segurança do código completo (controle de acesso, upload, exportação em ZIP, geração de Ofícios) — um achado real corrigido: retenção documental era checada só no app, não no banco (bypassável via REST/Storage API direta); agora há triggers Postgres bloqueando `DELETE`/`UPDATE` de documentos retidos, tanto na tabela `documento` quanto em `storage.objects`
- [x] Preenchimento de Ofício direto na tela — "Criar e preencher" leva a um editor em tela (contador de campos `[entre colchetes]` pendentes, botão "Salvar Ofício"), sem baixar/reenviar arquivo manualmente
- [x] Cadastro de clientes (tela `/clientes`: nome, endereço, email, celular, CPF opcional) + combobox de busca nos formulários de documento/Ofício, vinculando por `cliente_id` sem perder o campo `cliente` (texto) já usado pela busca full-text
- [x] Logout automático por inatividade (2h sem uso, aviso 1min antes) — resposta a uma preocupação de segurança da cliente; o controle de expiração pelo painel do Supabase exige plano Pro, então a solução ficou no próprio app

**Importante:** o app está funcional de ponta a ponta em produção — login, upload, categorização, busca, exclusão e exportação testados no navegador com o usuário real e com a cliente, incluindo bugs achados e corrigidos no processo (busca full-text precisou virar trigger em vez de coluna gerada; nomes de arquivo com acento quebravam a chave no Storage, agora sanitizados; a migração de retenção não tinha sido aplicada no banco de produção, quebrando toda exclusão até ser corrigida; a mensagem de erro do modal de exclusão ficava escondida atrás do próprio modal; a separação entre corpo do Ofício e orientações de preenchimento falhava por causa de quebra de linha estilo Windows `\r\n`). Documentos podem ter retenção manual ou data fixa, que bloqueia a exclusão antes do prazo — reforçado a nível de banco, não só de aplicação. SSL/HTTPS ativo via Hostinger. Rename para Sigiloteca commitado (`1550913`); funcionalidade em si segue a partir de `a7dfe48`.

### Segurança, LGPD e sigilo profissional (09–10/09/2026)

Trabalho grande, feito em cima da Análise Jurídica da Angela e do checklist §49 pré-comercialização. Migrations `20260909000007` a `20260910000016`.

- [x] **Fundamento jurídico de retenção + legal hold** — enum `retention_basis` (7 fundamentos: obrigação legal, defesa em processo, etc.), coluna `legal_hold` em `documento` (preservação especial, sem data certa), triggers de retenção/storage atualizadas pra bloquear também por legal hold
- [x] **Log de auditoria** (`audit_log`) — login/logout, criação/edição/exclusão de documento e cliente, exportação, edição de metadados, anonimização; imutável por RLS (sem policy de update/delete); tela `/auditoria` traduz os eventos pra texto legível; retenção do próprio log em **3 anos** (art. 206, §3º, V do CC), via trigger sem depender de `pg_cron`
- [x] **MFA (TOTP)** — ativação/desativação em `/conta`, desafio de segundo fator em `/login/mfa`; o `proxy` força `aal2` em qualquer rota quando a conta tem fator verificado
- [x] **Bloqueio por tentativas de login** — 5 senhas erradas em 15 min bloqueia a conta por 15 min (por e-mail, não por IP); tela mostra tentativas restantes e o tempo real até o desbloqueio
- [x] **Revogação de sessão/token** — "Encerrar todas as sessões" em `/conta`, via `signOut({scope:'global'})`
- [x] **Requisitos de senha** — checklist visual ao vivo (8+ caracteres, maiúscula, minúscula, número, caractere especial), validado também no servidor (`src/lib/password.ts`); troca de senha não apaga mais os campos certos quando algum está errado (`useActionState`)
- [x] **Fluxo de convite/onboarding** (`/auth/confirm`, `/definir-senha`) — corrige o link de convite do Supabase, que não sabia gravar cookie de sessão no domínio do app; `scripts/convidar-usuario.mjs` gera o link via Admin API sem depender do e-mail nativo do Supabase (template só editável no plano Pro)
- [x] **Rate limit em exportações** — 10 exportações/hora por workspace, reaproveitando o próprio `audit_log`
- [x] **Edição de metadados de documento** (`/documentos/[id]/metadados`) — título, categoria, cliente, processo, área, tags editáveis mesmo em documento retido/legal hold (só o conteúdo do arquivo fica travado), com diff completo no log de auditoria
- [x] **Anonimização de documentos** — ação manual e irreversível: apaga o arquivo e o histórico de versões do Storage, limpa cliente/processo/área/tags, mantém o registro como dado anonimizado de uso do controlador (LGPD art. 16, IV); bloqueada nas mesmas condições que a exclusão
- [x] **Propagação de correção de dado** — corrigir o nome de um cliente atualiza automaticamente `documento.cliente` em todos os documentos vinculados (LGPD art. 18, III), em vez de deixar um nome antigo "congelado"
- [x] **Exclusão de cliente com confirmação reforçada** — passou a exigir digitar "EXCLUIR", igual à exclusão de documento, já que apaga dados pessoais (endereço, e-mail, celular, CPF) em definitivo
- [x] **Formulário de titulares** (`/titulares`, público + `/titulares/solicitacoes`, autenticado) — qualquer pessoa (cliente cadastrado ou não) pode exercer os direitos do art. 18 da LGPD; retorno ao titular continua manual
- [x] **Decisões jurídicas fechadas com a Angela**: comarca do foro (Belo Horizonte/MG), garantias dos suboperadores (Supabase/Cloudflare/Hostinger — redação da Cláusula 5 do contrato), segunda revisão jurídica externa (critério mantido: antes do 1º escritório-cliente pagante), normas da OAB seção 2 reestruturada (premissas técnicas vs. parecer jurídico separados)

**Ainda pendente** (ver `status-execucao-sigiloteca.md` para o detalhe completo): upgrade do plano Supabase (decisão de orçamento do Luiz), teste de restauração de backup, teste de incidente simulado, mecanismo de busca para titulares não cadastrados como cliente (aguardando processo da Angela), formalização por escrito da Política de Backup/Termos de Uso/Política de acesso mínimo (mérito já decidido, falta só redigir).

- [ ] **← PRÓXIMO PASSO**: rodar as migrações `20260910000011`–`20260910000016` em produção (se ainda não rodadas), validar o fluxo de convite e o MFA com um usuário real, e seguir com os itens "ainda pendente" acima antes de abrir cadastro para o primeiro escritório-cliente pagante.

## O que já existe neste repositório

```text
sigiloteca/
├── README.md            ← este arquivo
├── brand/                Identidade visual aprovada ("Pilha Organizada")
│   ├── icon-color.svg
│   ├── icon-mono.svg
│   ├── favicon.svg
│   ├── favicon.ico       Multi-resolução (16/32/48/64px), gerado do favicon.svg
│   ├── lockup-horizontal.svg
│   ├── lockup-stacked.svg
│   └── png/              Exports em PNG do ícone e dos lockups (64–512px)
├── design/
│   └── tokens.css         Variáveis CSS de cor + escala tipográfica (claro/escuro)
├── modelos/
│   └── oficio-padrao.md    Modelo padrão de Ofício
├── scripts/
│   └── convidar-usuario.mjs   Gera link de convite de conta via Admin API (sem depender do e-mail do Supabase)
├── supabase/
│   └── migrations/
│       ├── 20260820000001_init_schema.sql              Schema: workspace, documento, documento_versao + RLS
│       ├── 20260820000002_storage_documentos.sql        Bucket "documentos" + RLS de Storage
│       ├── 20260820000003_documento_busca.sql           Busca full-text via trigger (tsvector + GIN)
│       ├── 20260821000004_retencao_documentos.sql       Política de retenção e descarte
│       ├── 20260826000005_retencao_bloqueio_bd.sql      Retenção reforçada no banco (triggers em documento e storage.objects)
│       ├── 20260827000006_cadastro_clientes.sql         Tabela cliente + RLS + documento.cliente_id
│       ├── 20260909000007_matriz_retencao_juridica.sql  Fundamento jurídico de retenção (retention_basis) + legal_hold
│       ├── 20260909000008_log_auditoria.sql             Tabela audit_log (imutável por RLS)
│       ├── 20260909000009_log_auditoria_retencao_email.sql  user_email no audit_log + retenção do log
│       ├── 20260909000010_revisao_rls_storage.sql       Hardening de RLS/Storage (UPDATE também bloqueado)
│       ├── 20260910000011_bloqueio_tentativas_login.sql Bloqueio por tentativas de login
│       ├── 20260910000012_login_lockout_feedback.sql    Retorna tentativas restantes + horário de desbloqueio
│       ├── 20260910000013_metadados_documento_audit.sql Evento document_metadata_update
│       ├── 20260910000014_anonimizacao_documento.sql    Coluna documento.anonymized + evento document_anonymize
│       ├── 20260910000015_titulares_solicitacoes.sql    Tabela solicitacao_titular (RLS pública pra INSERT)
│       └── 20260910000016_retencao_audit_log_3_anos.sql Retenção do audit_log de 12 meses para 3 anos
├── src/
│   ├── proxy.ts           Sessão + proteção de rotas + step-up de MFA (convenção Next 16, era middleware.ts)
│   ├── app/
│   │   ├── page.tsx        Dashboard: upload, filtro/busca, lista de documentos
│   │   ├── layout.tsx      Fontes da marca + InactivityGuard (logout automático)
│   │   ├── login/          Login (email+senha) + bloqueio por tentativas; login/mfa/ = desafio de segundo fator
│   │   ├── auth/confirm/   Troca token de e-mail (convite) por sessão de verdade (verifyOtp)
│   │   ├── definir-senha/  Primeiro acesso após convite — define senha sem pedir a atual
│   │   ├── conta/          Senha (com checklist de requisitos), MFA, encerrar todas as sessões
│   │   ├── clientes/       Cadastro de clientes (criar, editar, excluir com confirmação digitada)
│   │   ├── documentos/[id]/editar/     Editor de Ofício em tela (preencher + salvar)
│   │   ├── documentos/[id]/metadados/  Editar título/categoria/cliente/processo/área/tags
│   │   ├── auditoria/      Log de eventos do workspace (só leitura)
│   │   ├── titulares/      Formulário público de direitos LGPD + solicitacoes/ (lista autenticada)
│   │   ├── actions.ts       Server action de logout
│   │   ├── actions/audit.ts        logAuditEvent + tipos de ação
│   │   ├── actions/documentos.ts   Criar, editar metadados, anonimizar, excluir documento
│   │   ├── actions/clientes.ts     Criar, editar (com propagação de correção), excluir cliente
│   │   └── api/exportar/route.ts   Exportação em .zip, autenticada e com rate limit
│   ├── components/         UploadForm, NewOficioForm, DocumentList, OficioEditor, ClienteForm, ClienteList,
│   │                       ClienteCombobox, InactivityGuard, MfaManager, ChangePasswordForm,
│   │                       PasswordRequisitosChecklist, SenhaInicialForm, EditarMetadadosForm,
│   │                       SolicitacaoTitularForm, SolicitacoesTitularList
│   └── lib/
│       ├── supabase/       client.ts, server.ts, middleware.ts (sessão + MFA + rotas públicas)
│       ├── workspace.ts    getOrCreateWorkspace (bootstrap do workspace único)
│       ├── audit-log.ts    Labels e descrição legível dos eventos de auditoria
│       ├── password.ts     Requisitos de senha compartilhados (checklist + validação no servidor)
│       ├── retention.ts    Opções de fundamento jurídico de retenção
│       └── titulares.ts    Labels dos direitos do titular (LGPD art. 18)
├── .env.local.example     Modelo do .env.local (o real é gitignorado, uma cópia por máquina) — inclui
│                          NEXT_PUBLIC_SITE_URL e SUPABASE_SERVICE_ROLE_KEY (só scripts administrativos)
└── package.json           Next.js 16, React 19, Tailwind 4, @supabase/supabase-js, @supabase/ssr
```

## Stack decidida (ADR-001)

| Papel | Escolha | Motivo |
| --- | --- | --- |
| Frontend | Next.js | Web hoje, caminho aberto pra PWA depois |
| Backend + Auth | Supabase (Postgres) | RLS nativo já isola dados por workspace desde o dia 1 |
| Arquivos — documentos | Supabase Storage | PDFs, DOCX, RG/certidões escaneadas |
| Arquivos — geoespaciais/grandes | Cloudflare R2 | Sem custo de egress, mais barato pra `.dwg`/`.shp`/mapas grandes |
| Busca | Postgres full-text search | Suficiente pro volume do MVP |
| Backup local | Botão "Exportar tudo" (.zip) | Nuvem é a fonte oficial; local é só cópia sob demanda, com rate limit |
| Hospedagem | Hostinger (plano Business, Web Apps/Node.js) | Deploy automático via GitHub (`luizgteixeira/sigiloteca-prod`, branch `main`) |
| Domínio | sigiloteca.com.br | SSL/HTTPS ativo; CDN da Hostinger mantido **desligado** (fazia cache full-page ignorando sessão) |

Hospedagem e domínio: por conta do desenvolvedor (Luiz), sem custo adicional pra cliente nesta fase.

## Modelo de dados (o que prototipar agora)

```text
Workspace (o escritório da cliente)
  → Categoria (uma das 6 abaixo)
    → Documento (arquivo + cliente, processo, área, tags, fundamento de retenção, legal hold, anonimização)
      → Versão (histórico — usado pelos modelos que evoluem, ex: Ofício)

Cliente (cadastro do escritório — pessoa física/jurídica atendida)
Audit_log (trilha imutável de eventos, por workspace)
Login_lockout (contagem de tentativas de login, por e-mail — sem RLS de app, só via função)
Solicitacao_titular (pedidos do formulário público de direitos LGPD — sem workspace_id)
```

### As 6 categorias validadas

| Categoria              | Conteúdo                                             | Observação                                                                                              |
| ---------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Petições               | Peças processuais                                    | —                                                                                                       |
| Modelos de Contrato    | Templates reutilizáveis                              | Suporta "novo a partir do modelo"                                                                       |
| Decisões Judiciais     | Sentenças, despachos                                 | —                                                                                                       |
| Ofícios                | Peças de ofício                                      | **Sempre nasce de um modelo padrão** — ação "Novo a partir deste modelo"                                |
| Documentos de Clientes | RG, matrículas, certidões                            | Dado sensível — mesmo nível de sigilo dos autos                                                         |
| Geoespacial / Grandes  | Mapas, `.dwg`, `.shp`, `.kml`/`.kmz`, `.jpg`, `.png` | Binários grandes, **sem preview no MVP** — só download pro programa certo (AutoCAD, QGIS, Google Earth) |

### Regras importantes pro schema

- Tudo isolado por `workspace_id` via Row Level Security do Supabase, mesmo com um único usuário hoje — é isso que permite abrir pra outros escritórios depois sem reescrever nada. Exceção deliberada: `solicitacao_titular` (formulário público de titulares) não tem `workspace_id`, porque o Sigiloteca hoje serve um único escritório por instalação.
- Documentos de arquivos grandes/geoespaciais devem guardar qual provedor de storage foi usado (Supabase Storage vs R2), já que são dois buckets diferentes.
- Categoria "Ofícios" precisa de um campo/flag pra marcar qual documento é o "modelo padrão" da categoria.
- Retenção não é um prazo único: cada documento retido precisa de `retention_basis` (fundamento jurídico) explícito — o sistema não presume motivo sozinho, quem decide é o escritório/controlador.

## Design system

Já importado em `src/app/globals.css` e aplicado em todas as telas reais. Resumo:

- **Cores**: `--ink` (#1e2230), `--bg`/`--surface`/`--surface-2` (tons de papel), `--accent` (#7a2333, oxblood da marca), `--success`/`--warning`/`--danger` + variantes `-soft`, todos com equivalente de modo escuro no mesmo nome de token.
- **Tipografia**: Fraunces (títulos/H1/H2), Source Sans 3 (texto de interface/rodapé), IBM Plex Mono (categorias, dados, rótulos).
- Referência visual completa: artifact "Design System Escritório Virtual" (publicado na conversa anterior) e PDF salvo em `luiz-gustavo-dev\escritorio-virtual\Design System - Escritorio Virtual.pdf`. Manual de uso atualizado em `luiz-gustavo-dev\escritorio-virtual\manual-uso-sigiloteca.pdf`.

## Fora de escopo nesta fase

A cliente autorizou a comercialização (10/09/2026), mas a infraestrutura técnica de multiusuário/multi-tenant ainda não foi construída — a autorização é uma decisão de negócio, não implica que estes itens já existam:

- Login separado por usuário dentro do mesmo escritório (planos, papéis de acesso, cobrança)
- Aplicativo mobile nativo
- Classificação automática de documentos por IA/OCR
- Assinatura eletrônica de documentos
