'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/app/actions/audit';
import { senhaAtendeRequisitos } from '@/lib/password';

export type UpdatePasswordState = {
  erro?: 'atual' | 'confirmacao' | 'fraca' | 'servidor';
  sucesso?: boolean;
  // Só muda (e limpa os campos) quando a troca dá certo — um erro devolve o
  // mesmo valor, o que mantém tudo que o usuário já tinha digitado na tela
  // em vez de forçar ele a redigitar tudo de novo por causa de um campo só.
  resetToken: number;
};

export async function updatePassword(
  state: UpdatePasswordState,
  formData: FormData
): Promise<UpdatePasswordState> {
  const senhaAtual = String(formData.get('senhaAtual') ?? '');
  const novaSenha = String(formData.get('novaSenha') ?? '');
  const confirmarSenha = String(formData.get('confirmarSenha') ?? '');

  if (!senhaAtendeRequisitos(novaSenha)) {
    return { erro: 'fraca', resetToken: state.resetToken };
  }
  if (novaSenha !== confirmarSenha) {
    return { erro: 'confirmacao', resetToken: state.resetToken };
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
    return { erro: 'atual', resetToken: state.resetToken };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: novaSenha,
  });

  if (updateError) {
    return { erro: 'servidor', resetToken: state.resetToken };
  }

  return { sucesso: true, resetToken: state.resetToken + 1 };
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
