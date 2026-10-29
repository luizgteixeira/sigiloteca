import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginRoute = request.nextUrl.pathname === "/login";
  const isMfaRoute = request.nextUrl.pathname === "/login/mfa";
  // Alvo dos links de convite/recuperação por e-mail — roda sem sessão
  // prévia, é ele que cria a sessão via verifyOtp().
  const isAuthConfirmRoute = request.nextUrl.pathname === "/auth/confirm";
  // Formulário público de direitos do titular (LGPD art. 18) — quem
  // preenche não é usuário do Sigiloteca, não faz sentido exigir login.
  const isTitularesFormRoute = request.nextUrl.pathname === "/titulares";
  // Pedido de link de redefinição de senha — quem esqueceu a senha não tem
  // sessão.
  const isEsqueciSenhaRoute = request.nextUrl.pathname === "/esqueci-senha";
  // Ajuda — parte das dúvidas (senha esquecida, celular do 2FA perdido)
  // acontece justamente antes de conseguir entrar.
  const isAjudaRoute = request.nextUrl.pathname === "/ajuda";

  if (
    !user &&
    !isLoginRoute &&
    !isAuthConfirmRoute &&
    !isTitularesFormRoute &&
    !isEsqueciSenhaRoute &&
    !isAjudaRoute
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    // Login com senha só abre sessão em aal1; se a conta tem MFA ativado,
    // toda rota fica bloqueada até o desafio de segundo fator ser cumprido.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const precisaMfa =
      aal?.nextLevel === "aal2" && aal.currentLevel !== aal.nextLevel;

    if (precisaMfa && !isMfaRoute && !isAjudaRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login/mfa";
      // Sem isso, o ?error= de outra tela (ex.: /login?error=link_expirado)
      // vinha junto e a tela do 2FA mostrava "Código inválido" sem o
      // usuário ter digitado nada.
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (!precisaMfa && (isLoginRoute || isMfaRoute)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
