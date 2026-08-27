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

async function resolveClienteNome(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  clienteId?: string
): Promise<{ nome: string | null; error?: string }> {
  if (!clienteId) {
    return { nome: null };
  }
  const { data: cliente, error } = await supabase
    .from('cliente')
    .select('nome')
    .eq('id', clienteId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (error) {
    return { nome: null, error: error.message };
  }
  if (!cliente) {
    return { nome: null, error: 'Cliente não encontrado.' };
  }
  return { nome: cliente.nome };
}

export type CreateDocumentoInput = {
  id: string;
  workspaceId: string;
  categoria: string;
  titulo: string;
  clienteId?: string;
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

  const { nome: clienteNome, error: clienteError } =
    await resolveClienteNome(supabase, input.workspaceId, input.clienteId);
  if (clienteError) {
    return { error: clienteError };
  }

  const { error } = await supabase.from('documento').insert({
    id: input.id,
    workspace_id: input.workspaceId,
    categoria: input.categoria,
    titulo: input.titulo,
    cliente: clienteNome,
    cliente_id: input.clienteId || null,
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
  clienteId?: string;
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

  const { nome: clienteNome, error: clienteError } =
    await resolveClienteNome(supabase, input.workspaceId, input.clienteId);
  if (clienteError) {
    return { error: clienteError };
  }

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
    cliente: clienteNome,
    cliente_id: input.clienteId || null,
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

export type UpdateOficioConteudoInput = {
  documentoId: string;
  workspaceId: string;
  conteudo: string;
};

export async function updateOficioConteudo(
  input: UpdateOficioConteudoInput
): Promise<ActionResult> {
  const conteudo = input.conteudo.trim();
  if (!conteudo) {
    return { error: 'O conteúdo não pode ficar vazio.' };
  }

  const supabase = await createClient();
  const { data: documento, error: documentoError } = await supabase
    .from('documento')
    .select('storage_path, categoria, is_modelo_padrao')
    .eq('id', input.documentoId)
    .eq('workspace_id', input.workspaceId)
    .maybeSingle();

  if (documentoError) {
    return { error: documentoError.message };
  }
  if (!documento) {
    return { error: 'Documento não encontrado.' };
  }
  if (documento.categoria !== 'oficios' || documento.is_modelo_padrao) {
    return { error: 'Este documento não pode ser editado por aqui.' };
  }

  const { error: uploadError } = await supabase.storage
    .from('documentos')
    .upload(documento.storage_path, conteudo, {
      upsert: true,
      contentType: 'text/markdown; charset=utf-8',
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: ultimaVersao, error: ultimaVersaoError } = await supabase
    .from('documento_versao')
    .select('numero')
    .eq('documento_id', input.documentoId)
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ultimaVersaoError) {
    return { error: ultimaVersaoError.message };
  }

  const { error: versaoError } = await supabase
    .from('documento_versao')
    .insert({
      documento_id: input.documentoId,
      numero: (ultimaVersao?.numero ?? 0) + 1,
      storage_provider: 'supabase',
      storage_path: documento.storage_path,
    });

  if (versaoError) {
    return { error: versaoError.message };
  }

  revalidatePath('/');
  revalidatePath(`/documentos/${input.documentoId}/editar`);
  return { error: null };
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
