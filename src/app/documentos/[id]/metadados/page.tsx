import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getOrCreateWorkspace } from '@/lib/workspace';
import { EditarMetadadosForm } from '@/components/editar-metadados-form';

function documentoEstaRetido(documento: {
  legal_hold: boolean;
  retention_until: string | null;
}): boolean {
  return (
    documento.legal_hold ||
    (documento.retention_until !== null &&
      new Date(documento.retention_until).getTime() > Date.now())
  );
}

export default async function EditarMetadadosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const workspace = await getOrCreateWorkspace(supabase, user.id, user.email);

  const { data: documento } = await supabase
    .from('documento')
    .select(
      'id, titulo, categoria, cliente_id, processo, area, tags, is_modelo_padrao, retention_until, legal_hold'
    )
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .maybeSingle();

  if (!documento) {
    notFound();
  }

  const { data: clientesRows } = await supabase
    .from('cliente')
    .select('id, nome')
    .eq('workspace_id', workspace.id)
    .order('nome');
  const clientes = clientesRows ?? [];

  const retido = documentoEstaRetido(documento);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between border-b border-line pb-5">
        <div className="flex items-center gap-3">
          <Image
            src="/sigiloteca-icon.svg"
            alt=""
            width={40}
            height={40}
            priority
          />
          <div>
            <p className="font-display text-xl font-semibold text-ink">
              {documento.titulo}
            </p>
            <p className="font-body text-sm text-ink-muted">
              Editar metadados · Sigiloteca
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="rounded-md border border-line px-3 py-2 font-body text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          ← Voltar
        </Link>
      </header>

      {retido && (
        <p className="rounded-md bg-warning-soft px-3 py-2 font-body text-sm text-ink">
          Este documento está retido ou sob preservação especial (legal
          hold) — o conteúdo do arquivo está travado, mas os metadados
          abaixo continuam editáveis. Toda alteração fica registrada na
          auditoria.
        </p>
      )}

      <EditarMetadadosForm
        documento={{
          id: documento.id,
          titulo: documento.titulo,
          categoria: documento.categoria,
          clienteId: documento.cliente_id,
          processo: documento.processo,
          area: documento.area,
          tags: documento.tags ?? [],
          isModeloPadrao: documento.is_modelo_padrao,
        }}
        workspaceId={workspace.id}
        clientes={clientes}
      />
    </div>
  );
}
