'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createDocumento } from '@/app/actions/documentos';

const CATEGORIAS = [
  { value: 'peticoes', label: 'Petições' },
  { value: 'modelos_contrato', label: 'Modelos de Contrato' },
  { value: 'decisoes_judiciais', label: 'Decisões Judiciais' },
  { value: 'oficios', label: 'Ofícios' },
  { value: 'documentos_clientes', label: 'Documentos de Clientes' },
  {
    value: 'geoespacial_grandes',
    label: 'Geoespacial / Grandes (em breve)',
    disabled: true,
  },
];

// A chave de objeto do Supabase Storage não aceita bem acentos/caracteres
// especiais — normaliza pra evitar "Invalid key" em nomes com ç, ã, espaços etc.
const DIACRITICS_RANGE = new RegExp('[\\u0300-\\u036f]', 'g');

function sanitizeFilename(filename: string): string {
  const semAcento = filename.normalize('NFD').replace(DIACRITICS_RANGE, '');
  return semAcento.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function UploadForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const file = event.target.files?.[0] ?? null;
    const url = file ? URL.createObjectURL(file) : null;
    previewUrlRef.current = url;
    setSelectedFile(file);
    setPreviewUrl(url);
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('file') as File | null;
    const titulo = String(formData.get('titulo') ?? '').trim();
    const categoria = String(formData.get('categoria') ?? '');
    const cliente = String(formData.get('cliente') ?? '').trim();
    const processo = String(formData.get('processo') ?? '').trim();
    const area = String(formData.get('area') ?? '').trim();
    const isModeloPadrao = formData.get('isModeloPadrao') === 'on';
    const retentionUntil = String(formData.get('retentionUntil') ?? '');
    const tagsRaw = String(formData.get('tags') ?? '');
    const tags = tagsRaw
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!file || file.size === 0) {
      setErrorMsg('Selecione um arquivo.');
      return;
    }
    if (!titulo) {
      setErrorMsg('Título é obrigatório.');
      return;
    }
    if (!categoria) {
      setErrorMsg('Selecione uma categoria.');
      return;
    }

    setSubmitting(true);

    try {
      const documentoId = crypto.randomUUID();
      const storagePath = `${workspaceId}/${documentoId}/${sanitizeFilename(file.name)}`;

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(storagePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const result = await createDocumento({
        id: documentoId,
        workspaceId,
        categoria,
        titulo,
        cliente,
        processo,
        area,
        tags,
        storagePath,
        isModeloPadrao,
        retentionUntil,
      });

      if (result.error) {
        setErrorMsg(result.error);
        return;
      }

      formRef.current?.reset();
      setCategoriaSelecionada('');
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      router.refresh();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao enviar o documento.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5"
    >
      <h2 className="font-display text-lg font-semibold text-ink">
        Novo documento
      </h2>

      {errorMsg && (
        <p className="rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger">
          {errorMsg}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label
            htmlFor="file"
            className="font-mono text-xs uppercase tracking-wide text-ink-muted"
          >
            Arquivo
          </label>
          <input
            id="file"
            name="file"
            type="file"
            required
            accept=".pdf,image/*,.doc,.docx,.xls,.xlsx,.txt,.md"
            onChange={handleFileChange}
            className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
          />
        </div>

        {selectedFile && previewUrl && (
          <div className="flex flex-col gap-2 rounded-md border border-line bg-surface-2 p-3 sm:col-span-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">
                Prévia para confirmação
              </p>
              <p className="font-body text-xs text-ink-muted">
                {selectedFile.name} · {formatFileSize(selectedFile.size)}
              </p>
            </div>
            {selectedFile.type === 'application/pdf' ? (
              <iframe
                src={`${previewUrl}#page=1&view=FitH`}
                title={`Prévia da primeira página de ${selectedFile.name}`}
                className="h-72 w-full rounded border border-line bg-white"
              />
            ) : selectedFile.type.startsWith('image/') ? (
              <div className="flex min-h-40 items-center justify-center rounded border border-line bg-white p-3">
                <Image
                  src={previewUrl}
                  alt={`Prévia de ${selectedFile.name}`}
                  width={800}
                  height={600}
                  unoptimized
                  className="max-h-72 max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="rounded border border-line bg-white px-4 py-8 text-center">
                <p className="font-display text-lg font-semibold text-ink">
                  {selectedFile.name}
                </p>
                <p className="mt-1 font-body text-sm text-ink-muted">
                  Este formato será armazenado para download após o envio.
                </p>
              </div>
            )}
          </div>
        )}

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
            className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="retentionUntil"
            className="font-mono text-xs uppercase tracking-wide text-ink-muted"
          >
            Reter até (opcional)
          </label>
          <input
            id="retentionUntil"
            name="retentionUntil"
            type="date"
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
            defaultValue=""
            onChange={(event) => setCategoriaSelecionada(event.target.value)}
            className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
          >
            <option value="" disabled>
              Selecione
            </option>
            {CATEGORIAS.map((categoria) => (
              <option
                key={categoria.value}
                value={categoria.value}
                disabled={categoria.disabled}
              >
                {categoria.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 self-end pb-2 font-body text-sm text-ink-muted">
          <input
            name="isModeloPadrao"
            type="checkbox"
            disabled={categoriaSelecionada !== 'oficios'}
            className="size-4 accent-accent"
          />
          Marcar como modelo padrão de Ofícios
        </label>

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
            className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="cliente"
            className="font-mono text-xs uppercase tracking-wide text-ink-muted"
          >
            Cliente
          </label>
          <input
            id="cliente"
            name="cliente"
            type="text"
            className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
          />
        </div>

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
            className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 self-start rounded-md bg-accent px-4 py-2 font-body font-medium text-surface transition-colors hover:bg-accent/85 disabled:opacity-60 disabled:hover:bg-accent"
      >
        {submitting ? 'Enviando...' : 'Enviar'}
      </button>
    </form>
  );
}
