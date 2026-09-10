'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateDocumentoMetadata } from '@/app/actions/documentos';
import { ClienteCombobox, type ClienteOption } from './cliente-combobox';

const CATEGORIAS = [
  { value: 'peticoes', label: 'Petições' },
  { value: 'modelos_contrato', label: 'Modelos de Contrato' },
  { value: 'decisoes_judiciais', label: 'Decisões Judiciais' },
  { value: 'oficios', label: 'Ofícios' },
  { value: 'documentos_clientes', label: 'Documentos de Clientes' },
  { value: 'geoespacial_grandes', label: 'Geoespacial / Grandes' },
];

export type DocumentoMetadata = {
  id: string;
  titulo: string;
  categoria: string;
  clienteId: string | null;
  processo: string | null;
  area: string | null;
  tags: string[];
  isModeloPadrao: boolean;
};

export function EditarMetadadosForm({
  documento,
  workspaceId,
  clientes,
}: {
  documento: DocumentoMetadata;
  workspaceId: string;
  clientes: ClienteOption[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setErrorMsg(null);
    setSucesso(false);

    const tagsRaw = String(formData.get('tags') ?? '');
    const tags = tagsRaw
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      const result = await updateDocumentoMetadata({
        documentoId: documento.id,
        workspaceId,
        titulo: String(formData.get('titulo') ?? ''),
        categoria: String(formData.get('categoria') ?? ''),
        clienteId: String(formData.get('clienteId') ?? '') || undefined,
        processo: String(formData.get('processo') ?? ''),
        area: String(formData.get('area') ?? ''),
        tags,
      });

      if (result.error) {
        setErrorMsg(result.error);
        return;
      }

      setSucesso(true);
      router.refresh();
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Erro ao salvar os metadados.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6"
    >
      {errorMsg && (
        <p className="rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger">
          {errorMsg}
        </p>
      )}
      {sucesso && (
        <p className="rounded-md bg-success-soft px-3 py-2 font-body text-sm text-success">
          Metadados atualizados.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label
            htmlFor="titulo"
            className="font-mono text-xs uppercase tracking-wide text-ink-muted"
          >
            Título
          </label>
          <input
            id="titulo"
            name="titulo"
            type="text"
            required
            defaultValue={documento.titulo}
            className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="categoria"
            className="font-mono text-xs uppercase tracking-wide text-ink-muted"
          >
            Categoria
          </label>
          <select
            id="categoria"
            name="categoria"
            required
            disabled={documento.isModeloPadrao}
            defaultValue={documento.categoria}
            className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink disabled:opacity-60"
          >
            {CATEGORIAS.map((categoria) => (
              <option key={categoria.value} value={categoria.value}>
                {categoria.label}
              </option>
            ))}
          </select>
          {documento.isModeloPadrao && (
            <p className="font-body text-xs text-ink-muted">
              Modelo padrão de Ofícios — categoria fixa.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="tags"
            className="font-mono text-xs uppercase tracking-wide text-ink-muted"
          >
            Tags (separadas por vírgula)
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            defaultValue={documento.tags.join(', ')}
            className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
          />
        </div>

        <ClienteCombobox
          clientes={clientes}
          name="clienteId"
          defaultValue={documento.clienteId ?? undefined}
        />

        <div className="flex flex-col gap-1">
          <label
            htmlFor="processo"
            className="font-mono text-xs uppercase tracking-wide text-ink-muted"
          >
            Processo
          </label>
          <input
            id="processo"
            name="processo"
            type="text"
            defaultValue={documento.processo ?? ''}
            className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="area"
            className="font-mono text-xs uppercase tracking-wide text-ink-muted"
          >
            Área
          </label>
          <input
            id="area"
            name="area"
            type="text"
            defaultValue={documento.area ?? ''}
            className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 self-start rounded-md bg-accent px-4 py-2 font-body font-medium text-surface transition-colors hover:bg-accent/85 disabled:opacity-60"
      >
        {submitting ? 'Salvando...' : 'Salvar metadados'}
      </button>
    </form>
  );
}
