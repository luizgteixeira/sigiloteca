'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/app/actions/audit';

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

// Revoga todos os refresh tokens do usuário (scope: 'global') — encerra
// qualquer sessão aberta em outros dispositivos/navegadores, inclusive a
// atual, que precisa logar de novo. Útil se a conta foi acessada de um
// computador compartilhado e a senha já foi trocada, ou em suspeita de
// sessão indevida.
export async function signOutAllSessions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  await logAuditEvent('logout', { metadata: { motivo: 'todas_sessoes' } });

  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) {
    redirect('/conta?erro=sessoes');
  }

  redirect('/login?motivo=sessoes_encerradas');
}
