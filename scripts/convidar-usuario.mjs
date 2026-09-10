#!/usr/bin/env node
// Gera um link de convite de conta sem depender do e-mail nativo do
// Supabase (cujo template de assunto/corpo só é editável no plano Pro).
// O link sai pronto pra você colar num e-mail seu, com o texto que quiser.
//
// Uso: node scripts/convidar-usuario.mjs email@exemplo.com

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

function carregarEnvLocal() {
  const caminho = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '.env.local'
  );
  let conteudo;
  try {
    conteudo = readFileSync(caminho, 'utf-8');
  } catch {
    return;
  }
  for (const linha of conteudo.split('\n')) {
    const match = linha.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  }
}

carregarEnvLocal();

const email = process.argv[2];
if (!email) {
  console.error('Uso: node scripts/convidar-usuario.mjs email@exemplo.com');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

if (!url || !serviceRoleKey) {
  console.error(
    'Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local.\n' +
      'A service role key fica em Settings → API → service_role secret no painel do Supabase.'
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.generateLink({
  type: 'invite',
  email,
});

if (error) {
  console.error('Erro ao gerar o convite:', error.message);
  process.exit(1);
}

// Não usa o action_link padrão do Supabase (data.properties.action_link) —
// ele aponta pro endpoint deles (auth/v1/verify), que não sabe gravar o
// cookie de sessão no domínio do app. Em vez disso, monta o link pra cair
// em /auth/confirm, a rota do próprio Sigiloteca que troca o token por uma
// sessão de verdade e manda pra /definir-senha.
const confirmUrl = new URL('/auth/confirm', siteUrl);
confirmUrl.searchParams.set('token_hash', data.properties.hashed_token);
confirmUrl.searchParams.set('type', data.properties.verification_type);
confirmUrl.searchParams.set('next', '/definir-senha');

if (!process.env.NEXT_PUBLIC_SITE_URL) {
  console.warn(
    `Aviso: NEXT_PUBLIC_SITE_URL não está no .env.local, usando ${siteUrl}. Para gerar o link de produção, defina NEXT_PUBLIC_SITE_URL=https://sigiloteca.com.br.`
  );
}

console.log('\nLink de convite (uso único, expira em algumas horas):\n');
console.log(confirmUrl.toString());
console.log(`\nEnvie esse link por e-mail para ${email}, com o texto que preferir.\n`);
