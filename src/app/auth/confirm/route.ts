import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EmailOtpType } from '@supabase/supabase-js';

// Rota que os links de e-mail do Supabase (convite, recuperação de senha
// etc.) precisam apontar quando o app usa sessão via cookie (@supabase/ssr).
// O link "action_link" padrão do Supabase aponta direto pro endpoint deles
// (auth/v1/verify), que não sabe gravar cookie no domínio do app — por isso
// scripts/convidar-usuario.mjs monta a própria URL com token_hash/type
// pra cair aqui, onde verifyOtp() troca o token por uma sessão de verdade.
//
// O e-mail de "esqueci a senha" usa o template padrão do Supabase, que passa
// pelo auth/v1/verify e volta pra cá com ?code= (fluxo PKCE) — esse code é
// trocado por sessão com exchangeCodeForSession(), usando o code verifier
// que ficou em cookie no navegador que pediu a redefinição.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';

  const supabase = await createClient();
  let ok = false;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (ok) {
    // Só caminhos internos — impede usar o link como redirecionamento
    // aberto para outro domínio.
    const destino = next.startsWith('/') && !next.startsWith('//') ? next : '/';
    const response = NextResponse.redirect(new URL(destino, origin));
    if (type === 'invite' || type === 'recovery') {
      // Autoriza /definir-senha a trocar a senha sem pedir a senha atual
      // (que o usuário não tem ou esqueceu) só nos minutos seguintes a um
      // convite/recuperação de verdade — não abre uma brecha geral de troca
      // de senha sem reauth.
      response.cookies.set(
        'definir-senha',
        type === 'recovery' ? 'recuperacao' : 'convite',
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 600,
          path: '/',
        }
      );
    }
    return response;
  }

  return NextResponse.redirect(new URL('/login?error=link_expirado', origin));
}
