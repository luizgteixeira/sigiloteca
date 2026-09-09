'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from './documentos';
import { logAuditEvent } from './audit';

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

  await logAuditEvent('client_create', {
    resourceType: 'cliente',
    resourceId: data.id,
    metadata: { nome },
  });

  revalidatePath('/clientes');
  revalidatePath('/');
  return { error: null, id: data.id };
}

export type UpdateClienteInput = CreateClienteInput & { id: string };

const CAMPOS_CLIENTE = ['nome', 'endereco', 'email', 'celular', 'cpf'] as const;

export async function updateCliente(
  input: UpdateClienteInput
): Promise<ActionResult> {
  const nome = input.nome.trim();
  if (!nome) {
    return { error: 'Nome é obrigatório.' };
  }

  const supabase = await createClient();

  const { data: antes } = await supabase
    .from('cliente')
    .select('nome, endereco, email, celular, cpf')
    .eq('id', input.id)
    .eq('workspace_id', input.workspaceId)
    .maybeSingle();

  const depois = {
    nome,
    endereco: input.endereco?.trim() || null,
    email: input.email?.trim() || null,
    celular: input.celular?.trim() || null,
    cpf: input.cpf?.trim() || null,
  };

  const { error } = await supabase
    .from('cliente')
    .update({ ...depois, updated_at: new Date().toISOString() })
    .eq('id', input.id)
    .eq('workspace_id', input.workspaceId);

  if (error) {
    if (isUniqueViolation(error)) {
      return { error: 'Já existe um cliente com este CPF.' };
    }
    return { error: error.message };
  }

  const alteracoes: Record<string, { de: unknown; para: unknown }> = {};
  if (antes) {
    for (const campo of CAMPOS_CLIENTE) {
      if (antes[campo] !== depois[campo]) {
        alteracoes[campo] = { de: antes[campo], para: depois[campo] };
      }
    }
  }

  await logAuditEvent('client_update', {
    resourceType: 'cliente',
    resourceId: input.id,
    metadata: { nome, alteracoes },
  });

  revalidatePath('/clientes');
  return { error: null };
}

export async function deleteCliente(
  id: string,
  workspaceId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from('cliente')
    .select('nome')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  const { error } = await supabase
    .from('cliente')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId);

  if (error) {
    return { error: error.message };
  }

  await logAuditEvent('client_delete', {
    resourceType: 'cliente',
    resourceId: id,
    metadata: { nome: cliente?.nome ?? null },
  });

  revalidatePath('/clientes');
  revalidatePath('/');
  return { error: null };
}
