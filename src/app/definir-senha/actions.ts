'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { senhaAtendeRequisitos } from '@/lib/password';
import { logAuditEvent } from '@/app/actions/audit';

export async function setInitialPassword(formData: FormData) {
  const cookieStore = await cookies();
  const origem = cookieStore.get('definir-senha')?.value;
  if (!origem) {
    redirect('/conta');
  }

  const novaSenha = String(formData.get('novaSenha') ?? '');
  const confirmarSenha = String(formData.get('confirmarSenha') ?? '');

  if (!senhaAtendeRequisitos(novaSenha)) {
    redirect('/definir-senha?erro=fraca');
  }
  if (novaSenha !== confirmarSenha) {
    redirect('/definir-senha?erro=confirmacao');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) {
    redirect('/definir-senha?erro=servidor');
  }

  // A sessão aberta pelo link de recuperação não passa por signIn(), então
  // o login precisa ser registrado aqui para aparecer na auditoria.
  if (origem === 'recuperacao') {
    await logAuditEvent('login', { metadata: { motivo: 'redefinicao_senha' } });
  }

  cookieStore.delete('definir-senha');
  redirect('/');
}
