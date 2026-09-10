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

  if (!user && !isLoginRoute && !isAuthConfirmRoute) {
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

    if (precisaMfa && !isMfaRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login/mfa";
      return NextResponse.redirect(url);
    }

    if (!precisaMfa && (isLoginRoute || isMfaRoute)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
