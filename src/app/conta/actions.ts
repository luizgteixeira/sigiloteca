'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function updatePassword(formData: FormData) {
  const senhaAtual = String(formData.get('senhaAtual') ?? '');
  const novaSenha = String(formData.get('novaSenha') ?? '');
  const confirmarSenha = String(formData.get('confirmarSenha') ?? '');

  if (novaSenha.length < 8) {
    redirect('/conta?erro=curta');
  }
  if (novaSenha !== confirmarSenha) {
    redirect('/conta?erro=confirmacao');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect('/login');
  }

  // Reautentica com a senha atual antes de trocar — evita que alguém com uma
  // sessão aberta (ex: computador compartilhado) troque a senha sem sabê-la.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: senhaAtual,
  });

  if (reauthError) {
    redirect('/conta?erro=atual');
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: novaSenha,
  });

  if (updateError) {
    redirect('/conta?erro=servidor');
  }

  redirect('/conta?sucesso=1');
}
