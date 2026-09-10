'use client';

import { useActionState } from 'react';
import { submeterSolicitacaoTitular } from '@/app/titulares/actions';
import { DIREITO_OPTIONS } from '@/lib/titulares';

type FormState = { error: string | null; enviado: boolean };

const initialState: FormState = { error: null, enviado: false };

export function SolicitacaoTitularForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const result = await submeterSolicitacaoTitular(formData);
      return { error: result.error, enviado: result.error === null };
    },
    initialState
  );

  if (state.enviado) {
    return (
      <div className="rounded-lg border border-line bg-surface p-6">
        <p className="font-body text-sm text-ink">
          Solicitação registrada. Vamos analisar e responder pelo e-mail
          informado dentro do prazo legal.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6"
    >
      {state.error && (
        <p className="rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label
          htmlFor="nome"
          className="font-mono text-xs uppercase tracking-wide text-ink-muted"
        >
          Nome
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="email"
          className="font-mono text-xs uppercase tracking-wide text-ink-muted"
        >
          E-mail para retorno
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="cpf"
          className="font-mono text-xs uppercase tracking-wide text-ink-muted"
        >
          CPF (opcional)
        </label>
        <input
          id="cpf"
          name="cpf"
          type="text"
          className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
        />
        <p className="font-body text-xs text-ink-muted">
          Ajuda a localizar seus dados mais rápido — não é obrigatório.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="direito"
          className="font-mono text-xs uppercase tracking-wide text-ink-muted"
        >
          O que você deseja
        </label>
        <select
          id="direito"
          name="direito"
          required
          defaultValue=""
          className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
        >
          <option value="" disabled>
            Selecione
          </option>
          {DIREITO_OPTIONS.map((opcao) => (
            <option key={opcao.value} value={opcao.value}>
              {opcao.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="descricao"
          className="font-mono text-xs uppercase tracking-wide text-ink-muted"
        >
          Detalhes (opcional)
        </label>
        <textarea
          id="descricao"
          name="descricao"
          rows={4}
          className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
        />
      </div>

      {/* Honeypot — invisível pra gente, visível pra bot */}
      <input
        type="text"
        name="empresa"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <button
        type="submit"
        disabled={pending}
        className="mt-2 self-start rounded-md bg-accent px-4 py-2 font-body font-medium text-surface transition-colors hover:bg-accent/85 disabled:opacity-60"
      >
        {pending ? 'Enviando...' : 'Enviar solicitação'}
      </button>
    </form>
  );
}
