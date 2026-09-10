'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/app/actions/documentos';

export async function marcarSolicitacaoConcluida(
  id: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('solicitacao_titular')
    .update({ status: 'concluida', concluida_em: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/titulares/solicitacoes');
  return { error: null };
}
