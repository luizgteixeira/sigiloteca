'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/app/actions/audit';

export async function verifyMfaChallenge(formData: FormData) {
  const codigo = String(formData.get('codigo') ?? '');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const fator = factors?.totp[0];

  if (!fator) {
    redirect('/');
  }

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: fator.id,
    code: codigo,
  });

  if (error) {
    redirect('/login/mfa?error=1');
  }

  await logAuditEvent('login');

  // Veio de um link de convite/recuperação de senha: o segundo fator só
  // liberou a sessão, a senha nova ainda precisa ser definida.
  const cookieStore = await cookies();
  redirect(cookieStore.get('definir-senha') ? '/definir-senha' : '/');
}
