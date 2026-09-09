import { zipSync, strToU8 } from 'fflate';
import { createClient } from '@/lib/supabase/server';
import { getOrCreateWorkspace } from '@/lib/workspace';
import { logAuditEvent } from '@/app/actions/audit';

export const runtime = 'nodejs';

const MAX_DOCUMENTS = 500;
const MAX_TOTAL_BYTES = 500 * 1024 * 1024;

function sanitizePathPart(value: string): string {
  const withoutDiacritics = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return withoutDiacritics.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const workspace = await getOrCreateWorkspace(supabase, user.id, user.email);
  const { data: documentos, error: documentosError } = await supabase
    .from('documento')
    .select(
      'id, titulo, categoria, cliente, processo, area, tags, is_modelo_padrao, storage_path, created_at'
    )
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: true });

  if (documentosError) {
    return Response.json(
      { error: 'Não foi possível listar os documentos.' },
      { status: 500 }
    );
  }

  if ((documentos ?? []).length > MAX_DOCUMENTS) {
    return Response.json(
      { error: 'O backup excede o limite de 500 documentos por exportação.' },
      { status: 413 }
    );
  }

  const entries: Record<string, Uint8Array> = {};
  const manifest = [];
  let totalBytes = 0;

  for (const documento of documentos ?? []) {
    const { data: file, error: downloadError } = await supabase.storage
      .from('documentos')
      .download(documento.storage_path);

    if (downloadError || !file) {
      return Response.json(
        { error: `Não foi possível baixar o documento "${documento.titulo}".` },
        { status: 502 }
      );
    }

    totalBytes += file.size;
    if (totalBytes > MAX_TOTAL_BYTES) {
      return Response.json(
        { error: 'O backup excede o limite de 500 MB por exportação.' },
        { status: 413 }
      );
    }

    const filename = sanitizePathPart(
      documento.storage_path.split('/').pop() || 'arquivo'
    );
    const category = sanitizePathPart(documento.categoria);
    const title = sanitizePathPart(documento.titulo) || documento.id;
    const entryPath = `${category}/${title}-${documento.id.slice(0, 8)}/${filename}`;
    entries[entryPath] = new Uint8Array(await file.arrayBuffer());

    manifest.push({
      arquivo: entryPath,
      id: documento.id,
      titulo: documento.titulo,
      categoria: documento.categoria,
      cliente: documento.cliente,
      processo: documento.processo,
      area: documento.area,
      tags: documento.tags ?? [],
      is_modelo_padrao: documento.is_modelo_padrao,
      created_at: documento.created_at,
    });
  }

  entries['manifest.json'] = strToU8(
    JSON.stringify(
      {
        workspace: workspace.nome,
        exportado_em: new Date().toISOString(),
        documentos: manifest,
      },
      null,
      2
    )
  );

  const archive = zipSync(entries, { level: 6 });
  const date = new Date().toISOString().slice(0, 10);

  await logAuditEvent('document_export', {
    metadata: { quantidade: manifest.length },
  });

  return new Response(archive, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="sigiloteca-backup-${date}.zip"`,
      'Cache-Control': 'no-store',
    },
  });
}
