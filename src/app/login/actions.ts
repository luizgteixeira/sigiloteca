"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/app/actions/audit";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();

  // Se a conta já está bloqueada por tentativas anteriores, nem gasta uma
  // tentativa de senha — devolve o bloqueio direto.
  const { data: lockedUntil } = await supabase.rpc("check_login_lockout", {
    p_email: email,
  });
  if (lockedUntil) {
    redirect(`/login?error=bloqueado&ate=${encodeURIComponent(lockedUntil)}`);
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  const { data: tentativa } = await supabase.rpc("register_login_attempt", {
    p_email: email,
    p_success: !error,
  });

  if (error) {
    if (tentativa?.locked_until) {
      redirect(
        `/login?error=bloqueado&ate=${encodeURIComponent(tentativa.locked_until)}`
      );
    }
    const restantes = tentativa?.attempts_remaining;
    redirect(
      `/login?error=1${restantes != null ? `&restantes=${restantes}` : ""}`
    );
  }

  // Se a conta tem MFA ativado, o login só se completa de fato depois do
  // desafio de segundo fator — o proxy redireciona para /login/mfa, e é lá
  // que o evento de login é registrado.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const precisaMfa =
    aal?.nextLevel === "aal2" && aal.currentLevel !== aal.nextLevel;

  if (!precisaMfa) {
    await logAuditEvent("login");
  }
  redirect("/");
}
