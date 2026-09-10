'use server';

import { createClient } from '@/lib/supabase/server';
import { DIREITO_LABELS } from '@/lib/titulares';
import type { ActionResult } from '@/app/actions/documentos';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submeterSolicitacaoTitular(
  formData: FormData
): Promise<ActionResult> {
  // Honeypot: campo escondido do formulário real (CSS), só bot preenche.
  // Finge sucesso em vez de dar erro, pra não ensinar o bot a se adaptar.
  if (String(formData.get('empresa') ?? '').trim() !== '') {
    return { error: null };
  }

  const nome = String(formData.get('nome') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const cpf = String(formData.get('cpf') ?? '').trim();
  const direito = String(formData.get('direito') ?? '');
  const descricao = String(formData.get('descricao') ?? '').trim();

  if (!nome) {
    return { error: 'Nome é obrigatório.' };
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return { error: 'Informe um e-mail válido.' };
  }
  if (!(direito in DIREITO_LABELS)) {
    return { error: 'Selecione o direito que deseja exercer.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('solicitacao_titular').insert({
    nome,
    email,
    cpf: cpf || null,
    direito,
    descricao: descricao || null,
  });

  if (error) {
    return { error: 'Não foi possível registrar sua solicitação. Tente novamente.' };
  }

  return { error: null };
}
