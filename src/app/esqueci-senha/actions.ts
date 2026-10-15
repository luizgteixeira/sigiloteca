'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { origemPublica } from '@/lib/site-url';

export async function solicitarRedefinicaoSenha(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email) {
    redirect('/esqueci-senha');
  }

  const destino = new URL('/auth/confirm', origemPublica(await headers()));
  destino.searchParams.set('type', 'recovery');
  destino.searchParams.set('next', '/definir-senha');

  const supabase = await createClient();
  // O resultado é ignorado de propósito: a tela responde igual exista ou não
  // uma conta com esse email, para não revelar quem é usuário do sistema.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: destino.toString(),
  });

  redirect('/esqueci-senha?enviado=1');
}
