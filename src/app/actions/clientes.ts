'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from './documentos';

export type CreateClienteInput = {
  workspaceId: string;
  nome: string;
  endereco?: string;
  email?: string;
  celular?: string;
  cpf?: string;
};

function isUniqueViolation(error: { code?: string }): boolean {
  return error.code === '23505';
}

export async function createCliente(
  input: CreateClienteInput
): Promise<ActionResult<{ id: string }>> {
  const nome = input.nome.trim();
  if (!nome) {
    return { error: 'Nome é obrigatório.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cliente')
    .insert({
      workspace_id: input.workspaceId,
      nome,
      endereco: input.endereco?.trim() || null,
      email: input.email?.trim() || null,
      celular: input.celular?.trim() || null,
      cpf: input.cpf?.trim() || null,
    })
    .select('id')
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      return { error: 'Já existe um cliente com este CPF.' };
    }
    return { error: error.message };
  }

  revalidatePath('/clientes');
  revalidatePath('/');
  return { error: null, id: data.id };
}

export type UpdateClienteInput = CreateClienteInput & { id: string };

export async function updateCliente(
  input: UpdateClienteInput
): Promise<ActionResult> {
  const nome = input.nome.trim();
  if (!nome) {
    return { error: 'Nome é obrigatório.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('cliente')
    .update({
      nome,
      endereco: input.endereco?.trim() || null,
      email: input.email?.trim() || null,
      celular: input.celular?.trim() || null,
      cpf: input.cpf?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .eq('workspace_id', input.workspaceId);

  if (error) {
    if (isUniqueViolation(error)) {
      return { error: 'Já existe um cliente com este CPF.' };
    }
    return { error: error.message };
  }

  revalidatePath('/clientes');
  return { error: null };
}

export async function deleteCliente(
  id: string,
  workspaceId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('cliente')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/clientes');
  revalidatePath('/');
  return { error: null };
}
