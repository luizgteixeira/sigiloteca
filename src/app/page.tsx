import { createClient } from '@/lib/supabase/server';
import { getOrCreateWorkspace } from '@/lib/workspace';
import { signOut } from './actions';
import { UploadForm } from '@/components/upload-form';
import { NewOficioForm } from '@/components/new-oficio-form';
import { DocumentList, type DocumentoRow } from '@/components/document-list';
import Image from 'next/image';
import Link from 'next/link';

const CATEGORIAS = [
  { value: '', label: 'Todas as categorias' },
  { value: 'peticoes', label: 'Petições' },
  { value: 'modelos_contrato', label: 'Modelos de Contrato' },
  { value: 'decisoes_judiciais', label: 'Decisões Judiciais' },
  { value: 'oficios', label: 'Ofícios' },
  { value: 'documentos_clientes', label: 'Documentos de Clientes' },
  { value: 'geoespacial_grandes', label: 'Geoespacial / Grandes' },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const { q, categoria } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const workspace = await getOrCreateWorkspace(supabase, user.id, user.email);
  const displayName =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email;

  let query = supabase
    .from('documento')
    .select(
      'id, titulo, categoria, cliente, processo, tags, storage_path, created_at, is_modelo_padrao, retention_until, legal_hold, anonymized'
    )
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (categoria) {
    query = query.eq('categoria', categoria);
  }
  if (q) {
    query = query.textSearch('busca', q, {
      type: 'websearch',
      config: 'portuguese',
    });
  }

  const { data: documentos } = await query;
  const rows = documentos ?? [];

  const { data: clientesRows } = await supabase
    .from('cliente')
    .select('id, nome')
    .eq('workspace_id', workspace.id)
    .order('nome');
  const clientes = clientesRows ?? [];

  // Documento anonimizado não tem mais arquivo — nem tenta gerar link (e um
  // path já apagado no meio do lote derrubaria createSignedUrls pra todo
  // mundo, já que o catch abaixo zera a lista inteira).
  const paths = rows
    .filter((doc) => !doc.anonymized)
    .map((doc) => doc.storage_path);
  let signedUrls: { signedUrl: string | null; path: string | null }[] = [];
  if (paths.length) {
    try {
      const { data, error } = await supabase.storage
        .from('documentos')
        .createSignedUrls(paths, 300);
      if (error) throw error;
      signedUrls = data ?? [];
    } catch {
      // Um path problemático (ex: caracteres inválidos de uploads antigos) não
      // deve derrubar a página inteira — os documentos afetados só ficam sem
      // link de download.
      signedUrls = [];
    }
  }

  const urlByPath = new Map(
    signedUrls.map((entry) => [entry.path, entry.signedUrl])
  );

  const documentosComUrl: DocumentoRow[] = rows.map((doc) => ({
    id: doc.id,
    titulo: doc.titulo,
    categoria: doc.categoria,
    cliente: doc.cliente,
    processo: doc.processo,
    tags: doc.tags ?? [],
    created_at: doc.created_at,
    signedUrl: urlByPath.get(doc.storage_path) ?? null,
    isModeloPadrao: doc.is_modelo_padrao,
    retentionUntil: doc.retention_until,
    legalHold: doc.legal_hold,
    anonymized: doc.anonymized,
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between border-b border-line pb-5">
        <div className="flex items-center gap-3">
          <Image
            src="/sigiloteca-icon.svg"
            alt=""
            width={44}
            height={44}
            priority
          />
          <div>
            <p className="font-display text-2xl font-semibold text-ink">
              Sigiloteca
            </p>
            <p className="font-body text-sm text-ink-muted">
              Área de documentos · {displayName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/clientes"
            className="rounded-md border border-line px-3 py-2 font-body text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Clientes
          </Link>
          <Link
            href="/auditoria"
            className="rounded-md border border-line px-3 py-2 font-body text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Auditoria
          </Link>
          <Link
            href="/conta"
            className="rounded-md border border-line px-3 py-2 font-body text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Sua conta
          </Link>
          <a
            href="/api/exportar"
            className="rounded-md border border-line px-3 py-2 font-body text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Exportar tudo
          </a>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-line px-3 py-2 font-body text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <UploadForm workspaceId={workspace.id} clientes={clientes} />
      <NewOficioForm workspaceId={workspace.id} clientes={clientes} />

      <form method="get" className="flex flex-wrap gap-3">
        <input
          type="text"
          name="q"
          placeholder="Buscar por título, cliente, processo, tags..."
          defaultValue={q ?? ''}
          className="min-w-[240px] flex-1 rounded-md border border-line bg-surface px-3 py-2 font-body text-sm text-ink"
        />
        <select
          name="categoria"
          defaultValue={categoria ?? ''}
          className="rounded-md border border-line bg-surface px-3 py-2 font-body text-sm text-ink"
        >
          {CATEGORIAS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 font-body text-sm font-medium text-surface transition-colors hover:bg-accent/85"
        >
          Buscar
        </button>
      </form>

      <DocumentList documentos={documentosComUrl} workspaceId={workspace.id} />
    </div>
  );
}
