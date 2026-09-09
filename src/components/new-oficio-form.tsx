'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOficioFromModelo } from '@/app/actions/documentos';
import { RETENTION_BASIS_OPTIONS } from '@/lib/retention';
import { ClienteCombobox, type ClienteOption } from './cliente-combobox';

export function NewOficioForm({
  workspaceId,
  clientes,
}: {
  workspaceId: string;
  clientes: ClienteOption[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);

    const formData = new FormData(event.currentTarget);
    const titulo = String(formData.get('titulo') ?? '').trim();
    const tags = String(formData.get('tags') ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const retentionUntil = String(formData.get('retentionUntil') ?? '');
    const retentionBasis = String(formData.get('retentionBasis') ?? '');
    const legalHold = formData.get('legalHold') === 'on';

    if (retentionUntil && !retentionBasis) {
      setErrorMsg(
        'Reter até uma data exige informar o fundamento jurídico da retenção.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await createOficioFromModelo({
        workspaceId,
        titulo,
        clienteId: String(formData.get('clienteId') ?? '').trim() || undefined,
        processo: String(formData.get('processo') ?? ''),
        area: String(formData.get('area') ?? ''),
        tags,
        retentionUntil,
        retentionBasis,
        legalHold,
      });

      if (result.error !== null) {
        setErrorMsg(result.error);
        return;
      }

      formRef.current?.reset();
      router.push(`/documentos/${result.documentoId}/editar`);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao criar o Ofício.'
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
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">
          Novo Ofício
        </h2>
        <p className="font-body text-sm text-ink-muted">
          Criado a partir do modelo padrão — a próxima tela já abre pronta
          para você preencher.
        </p>
      </div>

      {errorMsg && (
        <p className="rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger">
          {errorMsg}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="titulo"
          type="text"
          required
          placeholder="Título do Ofício"
          aria-label="Título do Ofício"
          className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink sm:col-span-2"
        />
        <ClienteCombobox clientes={clientes} name="clienteId" label="" />
        <input
          name="processo"
          type="text"
          placeholder="Processo"
          aria-label="Processo"
          className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
        />
        <input
          name="area"
          type="text"
          placeholder="Área"
          aria-label="Área"
          className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
        />
        <input
          name="tags"
          type="text"
          placeholder="Tags separadas por vírgula"
          aria-label="Tags separadas por vírgula"
          className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
        />
        <label className="flex flex-col gap-1 font-mono text-xs uppercase tracking-wide text-ink-muted">
          Reter até (opcional)
          <input
            name="retentionUntil"
            type="date"
            className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm normal-case tracking-normal text-ink"
          />
        </label>
        <label className="flex flex-col gap-1 font-mono text-xs uppercase tracking-wide text-ink-muted">
          Fundamento da retenção (se houver data)
          <select
            name="retentionBasis"
            defaultValue=""
            className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm normal-case tracking-normal text-ink"
          >
            <option value="">Sem fundamento (sem data de retenção)</option>
            {RETENTION_BASIS_OPTIONS.map((basis) => (
              <option key={basis.value} value={basis.value}>
                {basis.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 font-body text-sm normal-case tracking-normal text-ink-muted sm:col-span-2">
          <input
            name="legalHold"
            type="checkbox"
            className="size-4 accent-accent"
          />
          Preservação especial (legal hold) — bloqueia exclusão mesmo sem data de retenção
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-md bg-accent px-4 py-2 font-body font-medium text-surface transition-colors hover:bg-accent/85 disabled:opacity-60 disabled:hover:bg-accent"
      >
        {submitting ? 'Criando...' : 'Criar e preencher'}
      </button>
    </form>
  );
}
