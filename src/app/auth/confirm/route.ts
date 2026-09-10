import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EmailOtpType } from '@supabase/supabase-js';

// Rota que os links de e-mail do Supabase (convite, recuperação de senha
// etc.) precisam apontar quando o app usa sessão via cookie (@supabase/ssr).
// O link "action_link" padrão do Supabase aponta direto pro endpoint deles
// (auth/v1/verify), que não sabe gravar cookie no domínio do app — por isso
// scripts/convidar-usuario.mjs monta a própria URL com token_hash/type
// pra cair aqui, onde verifyOtp() troca o token por uma sessão de verdade.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    if (!error) {
      const response = NextResponse.redirect(new URL(next, origin));
      if (type === 'invite') {
        // Autoriza /definir-senha a trocar a senha sem pedir a senha atual
        // (que não existe ainda) só nos minutos seguintes a um convite de
        // verdade — não abre uma brecha geral de troca de senha sem reauth.
        response.cookies.set('definir-senha', '1', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 600,
          path: '/',
        });
      }
      return response;
    }
  }

  return NextResponse.redirect(new URL('/login?error=1', origin));
}
