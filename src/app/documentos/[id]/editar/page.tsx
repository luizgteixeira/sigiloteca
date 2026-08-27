import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getOrCreateWorkspace } from '@/lib/workspace';
import { OficioEditor } from '@/components/oficio-editor';

// O modelo padrão traz, depois de um separador "---", uma seção de
// orientações pra quem preenche o modelo em si — não faz parte do Ofício
// final e não deve aparecer (nem ser editável) na tela de preenchimento.
function separarCorpoDasInstrucoes(bruto: string): {
  corpo: string;
  instrucoes: string | null;
} {
  // Tolerante a \n e \r\n — o arquivo pode ter sido salvo com quebras de
  // linha estilo Windows.
  const marcador = bruto.match(/\r?\n-{3,}\r?\n/);
  if (!marcador || marcador.index === undefined) {
    return { corpo: bruto.trim(), instrucoes: null };
  }
  return {
    corpo: bruto.slice(0, marcador.index).trim(),
    instrucoes: bruto.slice(marcador.index + marcador[0].length).trim(),
  };
}

export default async function EditarOficioPage({
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
    .select('id, titulo, categoria, is_modelo_padrao, storage_path')
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .maybeSingle();

  if (!documento || documento.categoria !== 'oficios') {
    notFound();
  }

  const { data: arquivo, error: downloadError } = await supabase.storage
    .from('documentos')
    .download(documento.storage_path);

  if (downloadError || !arquivo) {
    notFound();
  }

  const { corpo, instrucoes } = separarCorpoDasInstrucoes(
    await arquivo.text()
  );

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
              Preencher Ofício · Sigiloteca
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

      {documento.is_modelo_padrao ? (
        <p className="rounded-md bg-warning-soft px-3 py-2 font-body text-sm text-ink">
          Este é o modelo padrão de Ofícios, usado como base para todos os
          novos Ofícios — por isso não é editável por aqui. Para criar um
          Ofício preenchível, use &quot;Novo a partir deste modelo&quot; na
          tela inicial.
        </p>
      ) : (
        <OficioEditor
          documentoId={documento.id}
          workspaceId={workspace.id}
          conteudoInicial={corpo}
        />
      )}

      {instrucoes ? (
        <details className="rounded-lg border border-line bg-surface p-5">
          <summary className="cursor-pointer font-body text-sm font-medium text-ink-muted">
            Orientações de preenchimento
          </summary>
          <pre className="mt-3 whitespace-pre-wrap font-body text-sm text-ink-muted">
            {instrucoes}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
