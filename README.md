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
- [x] Deploy em produção: **sigiloteca.com.br** hospedado na Hostinger (plano Business, Node.js/Web Apps), deploy automático a cada push na branch `main` do repositório GitHub `luizgteixeira/sigiloteca-prod` (build com `next build --webpack` — o Turbopack quebra no ambiente de build da Hostinger)
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
- [x] **Fluxo de convite/onboarding** (`/auth/confirm`, `/definir-senha`) — corrige o link de convite do Supabase, que não sabia gravar cookie de sessão no domínio do app; `scripts/convidar-usuario.mjs` gera o link via Admin API, pra você enviar por e-mail próprio com o texto que quiser
- [x] **Rate limit em exportações** — 10 exportações/hora por workspace, reaproveitando o próprio `audit_log`
- [x] **Edição de metadados de documento** (`/documentos/[id]/metadados`) — título, categoria, cliente, processo, área, tags editáveis mesmo em documento retido/legal hold (só o conteúdo do arquivo fica travado), com diff completo no log de auditoria
- [x] **Anonimização de documentos** — ação manual e irreversível: apaga o arquivo e o histórico de versões do Storage, limpa cliente/processo/área/tags, mantém o registro como dado anonimizado de uso do controlador (LGPD art. 16, IV); bloqueada nas mesmas condições que a exclusão
- [x] **Propagação de correção de dado** — corrigir o nome de um cliente atualiza automaticamente `documento.cliente` em todos os documentos vinculados (LGPD art. 18, III), em vez de deixar um nome antigo "congelado"
- [x] **Exclusão de cliente com confirmação reforçada** — passou a exigir digitar "EXCLUIR", igual à exclusão de documento, já que apaga dados pessoais (endereço, e-mail, celular, CPF) em definitivo
- [x] **Formulário de titulares** (`/titulares`, público + `/titulares/solicitacoes`, autenticado) — qualquer pessoa (cliente cadastrado ou não) pode exercer os direitos do art. 18 da LGPD; o escritório recebe aviso por e-mail a cada pedido novo (desde 29/10), mas o retorno ao titular continua manual
- [x] **Decisões jurídicas fechadas com a Angela**: comarca do foro (Belo Horizonte/MG), garantias dos suboperadores (Supabase/Cloudflare/Hostinger — redação da Cláusula 5 do contrato), segunda revisão jurídica externa (critério mantido: antes do 1º escritório-cliente pagante), normas da OAB seção 2 reestruturada (premissas técnicas vs. parecer jurídico separados)

### Redefinição de senha, fuso horário e deploy (15/10/2026)

Pedidos da Angela depois do uso real: horário errado na auditoria e nenhuma forma de recuperar a senha esquecida.

- [x] **Fuso horário fixo em Brasília** — datas eram formatadas no servidor da Hostinger (outro fuso), deslocando os horários da auditoria; agora `src/lib/datas.ts` (`formatarDataHora`/`formatarData`, `America/Sao_Paulo`) é usado em todas as telas — registros antigos também aparecem certos, nada mudou no banco
- [x] **"Esqueceu sua senha?"** — link na tela de login → `/esqueci-senha` (resposta idêntica exista ou não a conta) → e-mail → `/auth/confirm` → `/definir-senha` ("Crie uma nova senha"); contas com MFA passam pelo código do autenticador antes; o acesso pelo link fica registrado na auditoria como login "pelo link de redefinição de senha"
- [x] **E-mail de autenticação via SMTP próprio** — Supabase configurado com SMTP próprio (até 29/10 uma caixa da Hostinger; hoje o Resend — ver seção de 29/10); o template "Reset Password" aponta direto pra `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/definir-senha`, sem depender do redirecionamento do Supabase nem de abrir no mesmo navegador
- [x] **Endereço público atrás do proxy** — na Hostinger `request.url` é `http://0.0.0.0:3000`; links e redirecionamentos usam `origemPublica()` (`src/lib/site-url.ts`): `NEXT_PUBLIC_SITE_URL` → `x-forwarded-host`/`host` → `localhost`
- [x] **Correções de fluxo** — link de e-mail inválido/usado/expirado mostra mensagem própria (antes: "Email ou senha inválidos"); o redirecionamento pro 2FA não carrega mais a query da rota anterior (antes a tela abria com "Código inválido" sem código digitado)
- [x] **Next.js 16.3.1 → 16.3.8** — corrige 6 vulnerabilidades apontadas pela Hostinger (3 críticas); `npm audit --omit=dev` sem vulnerabilidades

### Senhas, ajuda, titulares e segurança (29/10/2026)

- [x] **Migração 16 aplicada em produção** — conferido no banco que a 16 não tinha rodado (o log ainda era limpo após 12 meses); aplicada via SQL Editor e confirmado `interval '3 years'`. As migrações 11–15 já estavam aplicadas
- [x] **Supabase Pro** — backup diário (7 dias, só banco; arquivos do Storage continuam dependendo do "Exportar tudo"), "Prevent use of leaked passwords" ligado e "Inactivity timeout" de 2h no servidor, reforçando o logout por inatividade do app
- [x] **Formulários de senha** (Minha conta e `/definir-senha`) — recusa do Supabase traduzida (`motivoRecusaSenha`: "senha aparece em vazamentos", "precisa ser diferente da atual") em vez de erro genérico; "Salvar" desabilitado até cumprir todos os requisitos e a confirmação bater; colar/arrastar bloqueado em "Confirmar nova senha"; requisito cumprido destacado (fundo verde-claro, negrito, ícone preenchido)
- [x] **Troca de senha não derruba mais o 2FA** — a conferência da senha atual usa um cliente Supabase isolado (sem cookies); antes ela substituía a sessão aal2 por uma aal1 e o usuário voltava pro desafio de MFA
- [x] **Página de ajuda** (`/ajuda`, pública e liberada também no meio do desafio de 2FA) — só as dúvidas difíceis: 2FA (inclusive celular perdido, com contato do responsável técnico), senha, retenção/legal hold/anonimização/exclusão, titulares, exportação e auditoria; link "Ajuda" no menu, no login e na tela do código; "?" (`AjudaLink`) ao lado do legal hold e do 2FA. **Textos de Retenção e Titulares aguardam revisão da Angela**
- [x] **Aviso por e-mail de solicitação de titular** — o formulário público dispara e-mail (nodemailer, `src/lib/aviso-email.ts`, mesmo SMTP do Supabase) para `AVISO_TITULARES_PARA` com o direito pedido, a data e o link do painel — sem nome, e-mail, CPF ou descrição do titular. Best-effort: sem as variáveis `SMTP_*` ou com falha no envio, a solicitação é registrada normalmente
- [x] **Exportação** — pastas do ZIP só com o título (sufixo "(2)", "(3)" apenas para título repetido na mesma categoria; o id fica no `manifest.json`); documento anonimizado entra só no manifest (`arquivo: null`), em vez de derrubar a exportação inteira com 502 ao tentar baixar um arquivo já apagado
- [x] **Interface** — "Baixar" abre em nova aba; "Sua conta" virou "Minha conta"; botão flutuante "voltar ao início" (`VoltarAoTopo`) na Ajuda e na Auditoria
- [x] **Next.js 16.3.8 → 16.4.3** — corrige uma RCE crítica na otimização de imagens com SVG, um DoS via Server Actions e uma RCE em `use cache`, além do zod; `npm audit` sem vulnerabilidades (inclusive dependências de desenvolvimento)

### Escritório com várias pessoas — fase 1 (29/10/2026)

Várias pessoas no mesmo escritório, cada uma com um papel. Migração `20261029000017_equipe_escritorio` (aplicada pelo SQL Editor — o conector MCP recusou o `apply_migration`).

- [x] **`workspace_membro`** (escritório, usuário, e-mail, papel; cada pessoa em um único escritório). Todas as regras de acesso — documento, versões, cliente, auditoria, arquivos do Storage, titulares — passaram de "dono do escritório" (`owner_id`) para "membro", via `eh_membro()`/`eh_admin()`/`papel_do_usuario()` (security definer). `workspace.owner_id` ficou só como histórico
- [x] **Papéis** (`src/lib/permissoes.ts`, espelhado no banco): **Administrador** (tudo, inclusive equipe, auditoria, exportar, excluir/anonimizar documentos, excluir clientes) · **Advogado** (documentos, clientes e titulares) · **Assistente** (documentos e clientes). O que o papel não permite some da tela, é recusado na server action e no banco (policies de delete só para admin; trigger impede não-admin de anonimizar)
- [x] **Tela Equipe** (`/equipe`, só administrador): convidar por e-mail (service role cria a conta + e-mail pelo SMTP; sem SMTP ou com falha, a tela mostra o link para repassar e o código do erro; quem nunca entrou aparece como "Convite pendente", com "Gerar novo link" e "Cancelar convite"), trocar papel, remover, renomear o escritório. Trigger impede deixar o escritório sem administrador; ninguém remove a si mesmo. Eventos `member_invite`/`member_role_change`/`member_remove` na auditoria
- [x] **Sem escritório** (removido da equipe ou conta sem convite): tela própria, nada do escritório aparece. `getEscritorio` substituiu `getOrCreateWorkspace` — o app não cria mais escritório sozinho
- [x] **Correção de segurança:** a inclusão em `audit_log` não conferia se o evento era do escritório de quem grava; agora exige ser membro
- [x] **Dados de produção:** o escritório `7ef92a7f…` (que tinha os 3 documentos, o cliente e o histórico) virou o oficial, com Angela e Luiz como administradores (Luiz até a Angela decidir, pela política de acesso mínimo); o escritório vazio da Angela ficou sem membros e seus 3 eventos de auditoria foram movidos para o oficial. Feito direto no banco, fora do repositório (espelho público). Testado simulando administrador, assistente e conta sem escritório
- [x] `SUPABASE_SERVICE_ROLE_KEY` nas variáveis da Hostinger; escritório renomeado ("Angela Vieira & Associados")
- [x] **E-mail via Resend** — o plano de e-mail da Hostinger para sigiloteca.com.br expirou (não renovado) e a caixa usada no SMTP deixou de autenticar, derrubando redefinição de senha, convites e aviso de titulares. Agora tudo sai pelo **Resend** (domínio sigiloteca.com.br verificado por DNS, remetente `nao-responda@sigiloteca.com.br`, sem caixa de e-mail): SMTP do Supabase e variáveis `SMTP_HOST=smtp.resend.com`, `SMTP_PORT=465`, `SMTP_USER=resend`, `SMTP_PASS=<chave de API>`, `SMTP_FROM` (nova — o usuário do SMTP do Resend não é um e-mail). Plano grátis: 100/dia, 3.000/mês
- [ ] **Pendente:** Angela decidir se o Luiz continua administrador (política de acesso mínimo)
- **Fase 2 (vários escritórios):** cadastro de escritório novo, formulário de titulares por escritório (`solicitacao_titular` ainda não tem `workspace_id` — hoje administradores e advogados de qualquer escritório veem todas), uma pessoa em mais de um escritório, cobrança

**Ainda pendente** (ver `status-execucao-sigiloteca.md` para o detalhe completo): teste de restauração de backup (agora viável: plano Supabase Pro desde 29/10/2026, com backup diário), revisão pela Angela dos textos de Retenção e Titulares da página `/ajuda`, teste de incidente simulado, mecanismo de busca para titulares não cadastrados como cliente (aguardando processo da Angela), formalização por escrito da Política de Backup/Termos de Uso/Política de acesso mínimo (mérito já decidido, falta só redigir).

- [x] Migrações `20260910000011`–`20260910000016` conferidas e aplicadas em produção (29/10/2026). Como foram rodadas pelo SQL Editor, o histórico de migrações do Supabase fica vazio — para conferir, olhe direto as tabelas/funções.
- [x] MFA e fluxo de e-mail (`/auth/confirm` → `/definir-senha`) validados com usuário real em produção, via redefinição de senha (15/10/2026)
- [ ] **← PRÓXIMO PASSO**: seguir com os itens "ainda pendente" acima antes de abrir cadastro para o primeiro escritório-cliente pagante.

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
│       ├── 20260910000016_retencao_audit_log_3_anos.sql Retenção do audit_log de 12 meses para 3 anos
│       └── 20261029000017_equipe_escritorio.sql        Membros e papéis do escritório + todas as regras de acesso por membro
├── src/
│   ├── proxy.ts           Sessão + proteção de rotas + step-up de MFA (convenção Next 16, era middleware.ts)
│   ├── app/
│   │   ├── page.tsx        Dashboard: upload, filtro/busca, lista de documentos
│   │   ├── layout.tsx      Fontes da marca + InactivityGuard (logout automático)
│   │   ├── login/          Login (email+senha) + bloqueio por tentativas; login/mfa/ = desafio de segundo fator
│   │   ├── auth/confirm/   Troca token de e-mail (convite/recuperação) por sessão (verifyOtp ou code PKCE)
│   │   ├── esqueci-senha/  Pedido de link de redefinição de senha (público)
│   │   ├── definir-senha/  Nova senha sem pedir a atual — após convite ou link de recuperação (cookie de 10 min)
│   │   ├── conta/          Senha (com checklist de requisitos), MFA, encerrar todas as sessões
│   │   ├── clientes/       Cadastro de clientes (criar, editar, excluir com confirmação digitada)
│   │   ├── documentos/[id]/editar/     Editor de Ofício em tela (preencher + salvar)
│   │   ├── documentos/[id]/metadados/  Editar título/categoria/cliente/processo/área/tags
│   │   ├── auditoria/      Log de eventos do workspace (só leitura)
│   │   ├── ajuda/          Ajuda pública só para as dúvidas difíceis (2FA, senha, retenção, titulares, exportação, auditoria)
│   │   ├── titulares/      Formulário público de direitos LGPD + solicitacoes/ (lista autenticada)
│   │   ├── actions.ts       Server action de logout
│   │   ├── actions/audit.ts        logAuditEvent + tipos de ação
│   │   ├── actions/documentos.ts   Criar, editar metadados, anonimizar, excluir documento
│   │   ├── actions/clientes.ts     Criar, editar (com propagação de correção), excluir cliente
│   │   └── api/exportar/route.ts   Exportação em .zip, autenticada e com rate limit
│   ├── components/         UploadForm, NewOficioForm, DocumentList, OficioEditor, ClienteForm, ClienteList,
│   │                       ClienteCombobox, InactivityGuard, MfaManager, ChangePasswordForm,
│   │                       PasswordRequisitosChecklist, SenhaInicialForm, EditarMetadadosForm,
│   │                       SolicitacaoTitularForm, SolicitacoesTitularList, PasswordField (bloqueia colar na
│   │                       confirmação), AjudaLink ("?" para /ajuda), VoltarAoTopo
│   └── lib/
│       ├── supabase/       client.ts, server.ts, middleware.ts (sessão + MFA + rotas públicas)
│       ├── datas.ts        Formatação de data/hora sempre no fuso de Brasília
│       ├── site-url.ts     origemPublica(): endereço público do site atrás do proxy da Hostinger
│       ├── aviso-email.ts  E-mail do próprio app (convites da equipe, aviso de titular) via SMTP (Resend)
│       ├── workspace.ts    getEscritorio (escritório + papel do usuário) e verificarPermissao
│       ├── permissoes.ts   Matriz de papéis (administrador/advogado/assistente)
│       ├── audit-log.ts    Labels e descrição legível dos eventos de auditoria
│       ├── password.ts     Requisitos de senha (checklist + validação no servidor) + motivoRecusaSenha
│       ├── retention.ts    Opções de fundamento jurídico de retenção
│       └── titulares.ts    Labels dos direitos do titular (LGPD art. 18)
├── .env.local.example     Modelo do .env.local (o real é gitignorado, uma cópia por máquina) — inclui
│                          NEXT_PUBLIC_SITE_URL, SUPABASE_SERVICE_ROLE_KEY (só scripts administrativos) e
│                          SMTP_* / SMTP_FROM / AVISO_TITULARES_PARA (e-mails do app; em produção, nas variáveis da Hostinger)
└── package.json           Next.js 16.4, React 19, Tailwind 4, @supabase/supabase-js, @supabase/ssr, nodemailer
```

## Stack decidida (ADR-001)

| Papel | Escolha | Motivo |
| --- | --- | --- |
| Frontend | Next.js | Web hoje, caminho aberto pra PWA depois |
| Backend + Auth | Supabase (Postgres) | RLS nativo já isola dados por workspace desde o dia 1 |
| Arquivos — documentos | Supabase Storage | PDFs, DOCX, RG/certidões escaneadas |
| Arquivos — geoespaciais/grandes | Cloudflare R2 (**planejado, ainda não implementado** — hoje tudo vai pro Supabase Storage) | Sem custo de egress, mais barato pra `.dwg`/`.shp`/mapas grandes |
| Busca | Postgres full-text search | Suficiente pro volume do MVP |
| Backup local | Botão "Exportar tudo" (.zip) | Nuvem é a fonte oficial; local é só cópia sob demanda, com rate limit |
| Hospedagem | Hostinger (plano Business, Web Apps/Node.js) | Deploy automático via GitHub (`luizgteixeira/sigiloteca-prod`, branch `main`); build com `--webpack` |
| E-mail (autenticação e app) | Resend via SMTP (Supabase + variáveis `SMTP_*`) | Envio padrão do Supabase só entrega pra membros da equipe; serviço transacional dispensa caixa de e-mail paga e envia como o domínio verificado |
| Domínio | sigiloteca.com.br | SSL/HTTPS ativo; CDN da Hostinger mantido **desligado** (fazia cache full-page ignorando sessão) |

Hospedagem e domínio: por conta do desenvolvedor (Luiz), sem custo adicional pra cliente nesta fase.

## Modelo de dados (o que prototipar agora)

```text
Workspace (o escritório da cliente)
  → Membro (pessoa da equipe + papel: administrador, advogado ou assistente)
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

- Tudo isolado por `workspace_id` via Row Level Security do Supabase, e o acesso é por ser membro do escritório (`workspace_membro`), não por ser dono — é isso que permite abrir pra outros escritórios depois sem reescrever nada. Exceção deliberada: `solicitacao_titular` (formulário público de titulares) não tem `workspace_id`, porque o Sigiloteca hoje serve um único escritório por instalação.
- Documentos de arquivos grandes/geoespaciais devem guardar qual provedor de storage foi usado (Supabase Storage vs R2), já que são dois buckets diferentes.
- Categoria "Ofícios" precisa de um campo/flag pra marcar qual documento é o "modelo padrão" da categoria.
- Retenção não é um prazo único: cada documento retido precisa de `retention_basis` (fundamento jurídico) explícito — o sistema não presume motivo sozinho, quem decide é o escritório/controlador.

## Design system

Já importado em `src/app/globals.css` e aplicado em todas as telas reais. Resumo:

- **Cores**: `--ink` (#1e2230), `--bg`/`--surface`/`--surface-2` (tons de papel), `--accent` (#7a2333, oxblood da marca), `--success`/`--warning`/`--danger` + variantes `-soft`, todos com equivalente de modo escuro no mesmo nome de token.
- **Tipografia**: Fraunces (títulos/H1/H2), Source Sans 3 (texto de interface/rodapé), IBM Plex Mono (categorias, dados, rótulos).
- Referência visual completa: artifact "Design System Escritório Virtual" (publicado na conversa anterior) e PDF salvo em `luiz-gustavo-dev\escritorio-virtual\Design System - Escritorio Virtual.pdf`. Manual de uso atualizado em `luiz-gustavo-dev\escritorio-virtual\manual-uso-sigiloteca.pdf`.

## Fora de escopo nesta fase

A cliente autorizou a comercialização (10/09/2026). Várias pessoas no mesmo escritório, com papéis, já existe (fase 1, 29/10/2026); ainda não existem:

- Vários escritórios na mesma instalação (cadastro de escritório, titulares por escritório, planos e cobrança) — fase 2
- Aplicativo mobile nativo
- Classificação automática de documentos por IA/OCR
- Assinatura eletrônica de documentos
