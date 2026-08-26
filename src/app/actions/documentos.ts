'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// Server Actions que lançam Error têm a mensagem escondida pelo Next.js em
// produção (React error #441, "omitted in production builds"). Por isso
// essas actions retornam { error } em vez de dar throw — é o padrão
// recomendado pelo próprio Next.js para erros esperados de negócio.
export type ActionResult<T extends object = object> =
  | ({ error: null } & T)
  | { error: string };

export type CreateDocumentoInput = {
  id: string;
  workspaceId: string;
  categoria: string;
  titulo: string;
  cliente?: string;
  processo?: string;
  area?: string;
  tags: string[];
  storagePath: string;
  isModeloPadrao?: boolean;
  retentionUntil?: string;
};

export async function createDocumento(
  input: CreateDocumentoInput
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from('documento').insert({
    id: input.id,
    workspace_id: input.workspaceId,
    categoria: input.categoria,
    titulo: input.titulo,
    cliente: input.cliente || null,
    processo: input.processo || null,
    area: input.area || null,
    tags: input.tags,
    is_modelo_padrao:
      input.categoria === 'oficios' && input.isModeloPadrao === true,
    retention_until: input.retentionUntil || null,
    retention_policy: input.retentionUntil ? 'fixed_date' : 'manual',
    storage_provider: 'supabase',
    storage_path: input.storagePath,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  return { error: null };
}

export type CreateOficioFromModeloInput = {
  workspaceId: string;
  titulo: string;
  cliente?: string;
  processo?: string;
  area?: string;
  tags?: string[];
  retentionUntil?: string;
};

export async function createOficioFromModelo(
  input: CreateOficioFromModeloInput
): Promise<ActionResult<{ documentoId: string }>> {
  const titulo = input.titulo.trim();
  if (!titulo) {
    return { error: 'Título é obrigatório.' };
  }

  const supabase = await createClient();
  const { data: modelo, error: modeloError } = await supabase
    .from('documento')
    .select('storage_path')
    .eq('workspace_id', input.workspaceId)
    .eq('categoria', 'oficios')
    .eq('is_modelo_padrao', true)
    .maybeSingle();

  if (modeloError) {
    return { error: modeloError.message };
  }
  if (!modelo) {
    return { error: 'Nenhum modelo padrão de Ofícios foi cadastrado.' };
  }

  const documentoId = crypto.randomUUID();
  const arquivoModelo =
    modelo.storage_path.split('/').pop() || 'oficio-padrao.md';
  const storagePath = `${input.workspaceId}/${documentoId}/${arquivoModelo}`;
  const { error: copyError } = await supabase.storage
    .from('documentos')
    .copy(modelo.storage_path, storagePath);

  if (copyError) {
    return { error: copyError.message };
  }

  const { error: documentoError } = await supabase.from('documento').insert({
    id: documentoId,
    workspace_id: input.workspaceId,
    categoria: 'oficios',
    titulo,
    cliente: input.cliente?.trim() || null,
    processo: input.processo?.trim() || null,
    area: input.area?.trim() || null,
    tags: input.tags ?? [],
    is_modelo_padrao: false,
    retention_until: input.retentionUntil || null,
    retention_policy: input.retentionUntil ? 'fixed_date' : 'manual',
    storage_provider: 'supabase',
    storage_path: storagePath,
  });

  if (documentoError) {
    await supabase.storage.from('documentos').remove([storagePath]);
    return { error: documentoError.message };
  }

  const { error: versaoError } = await supabase
    .from('documento_versao')
    .insert({
      documento_id: documentoId,
      numero: 1,
      storage_provider: 'supabase',
      storage_path: storagePath,
    });

  if (versaoError) {
    await supabase.from('documento').delete().eq('id', documentoId);
    await supabase.storage.from('documentos').remove([storagePath]);
    return { error: versaoError.message };
  }

  revalidatePath('/');
  return { error: null, documentoId };
}

export async function deleteDocumento(
  documentoId: string,
  workspaceId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: documento, error: documentoError } = await supabase
    .from('documento')
    .select('id, storage_path, retention_until')
    .eq('id', documentoId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (documentoError) {
    return { error: documentoError.message };
  }
  if (!documento) {
    return { error: 'Documento não encontrado.' };
  }
  if (
    documento.retention_until &&
    new Date(documento.retention_until).getTime() > Date.now()
  ) {
    return {
      error: `Este documento está retido até ${new Date(documento.retention_until).toLocaleDateString('pt-BR')}.`,
    };
  }

  const { data: versoes, error: versoesError } = await supabase
    .from('documento_versao')
    .select('storage_path')
    .eq('documento_id', documento.id);

  if (versoesError) {
    return { error: versoesError.message };
  }

  const paths = Array.from(
    new Set([
      documento.storage_path,
      ...(versoes ?? []).map((versao) => versao.storage_path),
    ])
  );
  const { error: storageError } = await supabase.storage
    .from('documentos')
    .remove(paths);

  if (storageError) {
    return { error: storageError.message };
  }

  const { error: deleteError } = await supabase
    .from('documento')
    .delete()
    .eq('id', documento.id)
    .eq('workspace_id', workspaceId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  revalidatePath('/');
  return { error: null };
}
