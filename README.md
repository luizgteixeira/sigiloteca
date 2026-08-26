# Sigiloteca

> Sistema de gestão documental para advocacia — começa como ferramenta pessoal (uso individual), com o objetivo de virar produto vendável para outros advogados depois de validado. Nome de trabalho anterior: "Escritório Virtual".

Desenvolvido por Luiz Gustavo — [luizgustavodev.com](https://luizgustavodev.com/)

## O que é

Um "escritório virtual": um lugar único e organizado para petições, modelos de contrato, decisões judiciais, ofícios, documentos de clientes e arquivos grandes/geoespaciais — resolvendo a dificuldade do usuário de manter tudo organizado hoje.

Ideia original: "é como se eu entrasse no meu notebook em uma sala secreta" — acesso rápido, tudo no lugar certo, sem fricção.

## Documentação de referência (fora deste repositório)

Toda a decisão de arquitetura e o histórico de negociação vivem no cofre do Obsidian, **não** neste repo:

- **Cofre**: `C:\Users\Luiz Gustavo\OneDrive\documentos\Escritório Virtual\Escritório Virtual\`
  - `Index.md` — visão geral do projeto
  - `ADRs\ADR-001 - Escritorio Virtual.md` — **decisão de arquitetura completa** (contexto, opções consideradas, modelo de dados, stack, consequências, checklist de ação)
  - `Proposta Comercial.md` — orçamento fechado com a cliente (R$ 4.641–7.182, tarifa amiga + 15% desconto)

Leia o ADR-001 antes de tomar qualquer decisão técnica nova — ele já resolveu vários trade-offs (por quê Next.js + Supabase, por quê dois provedores de storage, etc.) e não faz sentido reabrir essas discussões sem motivo novo.

## Status: onde parei

Checklist do ADR-001:

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
- [ ] **← PRÓXIMO PASSO: Usar em produção por 2–3 semanas e ajustar a organização antes de pensar em multiusuário**
- [ ] Se validar: revisar LGPD e sigilo profissional antes de abrir para outros advogados

**Importante:** o app está funcional de ponta a ponta em produção — login, upload, categorização, busca, exclusão e exportação testados no navegador com o usuário real e com a cliente, incluindo bugs achados e corrigidos no processo (busca full-text precisou virar trigger em vez de coluna gerada; nomes de arquivo com acento quebravam a chave no Storage, agora sanitizados; a migração de retenção não tinha sido aplicada no banco de produção, quebrando toda exclusão até ser corrigida; a mensagem de erro do modal de exclusão ficava escondida atrás do próprio modal). O modelo padrão de Ofício já pode gerar novos Ofícios, com a cópia registrada como versão inicial em `documento_versao`. A exportação completa em `.zip` é autenticada, limitada a 500 documentos/500 MB e inclui os arquivos do Storage e um `manifest.json` com os metadados. Documentos podem ter retenção manual ou data fixa, que bloqueia a exclusão antes do prazo — reforçado a nível de banco, não só de aplicação. SSL/HTTPS ativo via Hostinger; o app redireciona HTTP para HTTPS e envia headers de segurança. O próximo passo é usar o sistema em produção por 2–3 semanas e ajustar a organização. Rename para Sigiloteca commitado (`1550913`); funcionalidade em si segue a partir de `a7dfe48`.

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
├── supabase/
│   └── migrations/
│       ├── 20260820000001_init_schema.sql          Schema: workspace, documento, documento_versao + RLS
│       ├── 20260820000002_storage_documentos.sql    Bucket "documentos" + RLS de Storage
│       ├── 20260820000003_documento_busca.sql       Busca full-text via trigger (tsvector + GIN)
│       ├── 20260821000004_retencao_documentos.sql   Política de retenção e descarte
│       └── 20260826000005_retencao_bloqueio_bd.sql  Retenção reforçada no banco (triggers em documento e storage.objects)
├── src/
│   ├── proxy.ts           Sessão + proteção de rotas (convenção Next 16, era middleware.ts)
│   ├── app/
│   │   ├── page.tsx        Dashboard: upload, filtro/busca, lista de documentos
│   │   ├── layout.tsx      Fontes da marca (Fraunces/Source Sans 3/IBM Plex Mono)
│   │   ├── login/          Tela de login (email+senha) + server action
│   │   ├── actions.ts       Server action de logout
│   │   ├── actions/documentos.ts   Server actions: criar documento, criar Ofício a partir do modelo, excluir documento
│   │   └── api/exportar/route.ts   Rota autenticada de exportação em .zip (documentos + manifest.json)
│   ├── components/         UploadForm, NewOficioForm, DocumentList (com modal de confirmação de exclusão)
│   └── lib/
│       ├── supabase/       client.ts, server.ts, middleware.ts (sessão)
│       └── workspace.ts    getOrCreateWorkspace (bootstrap do workspace único)
├── .env.local.example     Modelo do .env.local (o real é gitignorado, uma cópia por máquina)
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
| Backup local | Botão "Exportar tudo" (.zip) | Nuvem é a fonte oficial; local é só cópia sob demanda |
| Hospedagem | Hostinger (plano Business, Web Apps/Node.js) | Deploy automático via GitHub (`luizgteixeira/sigiloteca-prod`, branch `main`) |
| Domínio | sigiloteca.com.br | SSL/HTTPS ativo; CDN da Hostinger mantido **desligado** (fazia cache full-page ignorando sessão) |

Hospedagem e domínio: por conta do desenvolvedor (Luiz), sem custo adicional pra cliente nesta fase.

## Modelo de dados (o que prototipar agora)

```text
Workspace (o escritório da cliente)
  → Categoria (uma das 6 abaixo)
    → Documento (arquivo + cliente, processo, área, tags)
      → Versão (histórico — usado pelos modelos que evoluem, ex: Ofício)
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

- Tudo isolado por `workspace_id` via Row Level Security do Supabase, mesmo com um único usuário hoje — é isso que permite abrir pra outros escritórios depois sem reescrever nada.
- Documentos de arquivos grandes/geoespaciais devem guardar qual provedor de storage foi usado (Supabase Storage vs R2), já que são dois buckets diferentes.
- Categoria "Ofícios" precisa de um campo/flag pra marcar qual documento é o "modelo padrão" da categoria.

## Design system

Já importado em `src/app/globals.css` e aplicado nas telas reais (login, dashboard). Resumo:

- **Cores**: `--ink` (#1e2230), `--bg`/`--surface`/`--surface-2` (tons de papel), `--accent` (#7a2333, oxblood da marca), `--success`/`--warning`/`--danger` + variantes `-soft`, todos com equivalente de modo escuro no mesmo nome de token.
- **Tipografia**: Fraunces (títulos/H1/H2), Source Sans 3 (texto de interface/rodapé), IBM Plex Mono (categorias, dados, rótulos).
- Referência visual completa: artifact "Design System Escritório Virtual" (publicado na conversa anterior) e PDF salvo em `luiz-gustavo-dev\escritorio-virtual\Design System - Escritorio Virtual.pdf`.

## Fora de escopo nesta fase

(Já orçado à parte, só depois de validar o uso pessoal)

- Multiusuário / venda pra outros escritórios (login separado, planos, cobrança)
- Aplicativo mobile nativo
- Classificação automática de documentos por IA/OCR
- Assinatura eletrônica de documentos
