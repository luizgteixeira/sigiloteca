'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCliente } from '@/app/actions/clientes';

export function ClienteForm({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);

    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const result = await createCliente({
        workspaceId,
        nome: String(formData.get('nome') ?? ''),
        endereco: String(formData.get('endereco') ?? ''),
        email: String(formData.get('email') ?? ''),
        celular: String(formData.get('celular') ?? ''),
        cpf: String(formData.get('cpf') ?? ''),
      });

      if (result.error !== null) {
        setErrorMsg(result.error);
        return;
      }

      formRef.current?.reset();
      router.refresh();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao cadastrar o cliente.'
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
        Novo cliente
      </h2>

      {errorMsg && (
        <p className="rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger">
          {errorMsg}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="nome"
          type="text"
          required
          placeholder="Nome"
          aria-label="Nome"
          className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink sm:col-span-2"
        />
        <input
          name="endereco"
          type="text"
          placeholder="Endereço"
          aria-label="Endereço"
          className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink sm:col-span-2"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          aria-label="Email"
          className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
        />
        <input
          name="celular"
          type="text"
          placeholder="Celular"
          aria-label="Celular"
          className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
        />
        <input
          name="cpf"
          type="text"
          placeholder="CPF (opcional)"
          aria-label="CPF"
          className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-md bg-accent px-4 py-2 font-body font-medium text-surface transition-colors hover:bg-accent/85 disabled:opacity-60 disabled:hover:bg-accent"
      >
        {submitting ? 'Cadastrando...' : 'Cadastrar cliente'}
      </button>
    </form>
  );
}
