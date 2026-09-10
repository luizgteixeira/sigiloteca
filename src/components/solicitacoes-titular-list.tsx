'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { marcarSolicitacaoConcluida } from '@/app/titulares/solicitacoes/actions';
import { DIREITO_LABELS } from '@/lib/titulares';

export type SolicitacaoRow = {
  id: string;
  nome: string;
  email: string;
  cpf: string | null;
  direito: string;
  descricao: string | null;
  status: string;
  created_at: string;
};

export function SolicitacoesTitularList({
  solicitacoes,
}: {
  solicitacoes: SolicitacaoRow[];
}) {
  const router = useRouter();
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function concluir(id: string) {
    setErrorMsg(null);
    setProcessandoId(id);
    try {
      const result = await marcarSolicitacaoConcluida(id);
      if (result.error) {
        setErrorMsg(result.error);
        return;
      }
      router.refresh();
    } finally {
      setProcessandoId(null);
    }
  }

  if (solicitacoes.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-surface p-5 font-body text-sm text-ink-muted">
        Nenhuma solicitação registrada ainda.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {errorMsg && (
        <p className="rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger">
          {errorMsg}
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[720px] font-body text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                Data
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                Nome
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                E-mail
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                Direito
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                Status
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted"></th>
            </tr>
          </thead>
          <tbody>
            {solicitacoes.map((solicitacao) => (
              <tr
                key={solicitacao.id}
                className="border-b border-line last:border-0 align-top"
              >
                <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                  {new Date(solicitacao.created_at).toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-ink">
                  {solicitacao.nome}
                  {solicitacao.cpf && (
                    <p className="font-mono text-xs text-ink-muted">
                      CPF: {solicitacao.cpf}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {solicitacao.email}
                </td>
                <td className="px-4 py-3 text-ink">
                  {DIREITO_LABELS[solicitacao.direito] ?? solicitacao.direito}
                  {solicitacao.descricao && (
                    <p className="mt-1 whitespace-pre-wrap text-xs text-ink-muted">
                      {solicitacao.descricao}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 font-mono text-xs ${
                      solicitacao.status === 'concluida'
                        ? 'bg-success-soft text-success'
                        : 'bg-warning-soft text-ink'
                    }`}
                  >
                    {solicitacao.status === 'concluida'
                      ? 'Concluída'
                      : 'Pendente'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {solicitacao.status !== 'concluida' && (
                    <button
                      type="button"
                      disabled={processandoId === solicitacao.id}
                      onClick={() => concluir(solicitacao.id)}
                      className="font-body text-sm font-medium text-accent underline transition-colors hover:text-ink disabled:opacity-60"
                    >
                      {processandoId === solicitacao.id
                        ? 'Salvando...'
                        : 'Marcar como concluída'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
