'use client';

import { useState } from 'react';
import Link from 'next/link';
import { anonymizeDocumento, deleteDocumento } from '@/app/actions/documentos';

export const CATEGORIA_LABELS: Record<string, string> = {
  peticoes: 'Petições',
  modelos_contrato: 'Modelos de Contrato',
  decisoes_judiciais: 'Decisões Judiciais',
  oficios: 'Ofícios',
  documentos_clientes: 'Documentos de Clientes',
  geoespacial_grandes: 'Geoespacial / Grandes',
};

export type DocumentoRow = {
  id: string;
  titulo: string;
  categoria: string;
  cliente: string | null;
  processo: string | null;
  tags: string[];
  created_at: string;
  signedUrl: string | null;
  isModeloPadrao: boolean;
  retentionUntil: string | null;
  legalHold: boolean;
  anonymized: boolean;
};

type Acao = 'excluir' | 'anonimizar';

const ACAO_CONFIG: Record<
  Acao,
  { palavra: string; titulo: string; verboEmAndamento: string }
> = {
  excluir: {
    palavra: 'EXCLUIR',
    titulo: 'Exclusão permanente',
    verboEmAndamento: 'Excluindo...',
  },
  anonimizar: {
    palavra: 'ANONIMIZAR',
    titulo: 'Anonimização permanente',
    verboEmAndamento: 'Anonimizando...',
  },
};

function motivoBloqueio(documento: DocumentoRow, acao: Acao): string | null {
  const verbo = acao === 'excluir' ? 'excluído' : 'anonimizado';
  if (documento.legalHold) {
    return `Este documento está sob preservação especial (legal hold) e não pode ser ${verbo}.`;
  }
  if (
    documento.retentionUntil &&
    new Date(documento.retentionUntil).getTime() > Date.now()
  ) {
    return `Este documento está retido até ${new Date(documento.retentionUntil).toLocaleDateString('pt-BR')} e não pode ser ${verbo}.`;
  }
  return null;
}

export function DocumentList({
  documentos,
  workspaceId,
}: {
  documentos: DocumentoRow[];
  workspaceId: string;
}) {
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendente, setPendente] = useState<{
    acao: Acao;
    documento: DocumentoRow;
  } | null>(null);
  const [confirmacao, setConfirmacao] = useState('');

  function handleAcao(acao: Acao, documento: DocumentoRow) {
    const bloqueio = motivoBloqueio(documento, acao);
    if (bloqueio) {
      setErrorMsg(bloqueio);
      setPendente(null);
      return;
    }
    setErrorMsg(null);
    setConfirmacao('');
    setPendente({ acao, documento });
  }

  async function confirmarAcao() {
    if (!pendente || confirmacao !== ACAO_CONFIG[pendente.acao].palavra) {
      return;
    }

    setProcessandoId(pendente.documento.id);
    try {
      const result =
        pendente.acao === 'excluir'
          ? await deleteDocumento(pendente.documento.id, workspaceId)
          : await anonymizeDocumento(pendente.documento.id, workspaceId);
      if (result.error) {
        setErrorMsg(result.error);
        return;
      }
      setPendente(null);
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : 'Erro ao processar o documento.'
      );
    } finally {
      setProcessandoId(null);
    }
  }

  if (documentos.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-surface p-5 font-body text-sm text-ink-muted">
        Nenhum documento encontrado.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <aside className="rounded-md border border-warning bg-warning-soft px-4 py-3 font-body text-sm text-ink">
        <strong className="font-semibold">Atenção:</strong> a exclusão remove o
        arquivo, o registro da base de dados e todo o histórico de versões. A
        anonimização apaga o arquivo e o vínculo com cliente/processo/tags,
        mas mantém o registro. As duas ações são permanentes e não podem ser
        desfeitas.
      </aside>
      {!pendente && errorMsg && (
        <p className="flex items-start justify-between gap-3 rounded-md bg-danger-soft px-3 py-2 font-body text-sm font-semibold text-danger">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            aria-label="Fechar aviso"
            className="shrink-0 leading-none text-danger/70 hover:text-danger"
          >
            ×
          </button>
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[640px] font-body text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                Título
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                Categoria
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                Cliente
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                Tags
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted"></th>
            </tr>
          </thead>
          <tbody>
            {documentos.map((documento) => (
              <tr
                key={documento.id}
                className="border-b border-line last:border-0"
              >
                <td className="px-4 py-3 text-ink">
                  {documento.titulo}
                  {documento.anonymized && (
                    <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
                      Anonimizado
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-accent-soft px-2 py-1 font-mono text-xs text-accent">
                    {CATEGORIA_LABELS[documento.categoria] ??
                      documento.categoria}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {documento.cliente ?? '—'}
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {documento.tags.length > 0 ? documento.tags.join(', ') : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {documento.categoria === 'oficios' &&
                    !documento.isModeloPadrao &&
                    !documento.anonymized ? (
                      <Link
                        href={`/documentos/${documento.id}/editar`}
                        className="font-body text-sm font-medium text-accent underline transition-colors hover:text-ink"
                      >
                        Editar
                      </Link>
                    ) : null}
                    <Link
                      href={`/documentos/${documento.id}/metadados`}
                      className="font-body text-sm font-medium text-accent underline transition-colors hover:text-ink"
                    >
                      Metadados
                    </Link>
                    {documento.anonymized ? (
                      <span className="text-ink-muted">—</span>
                    ) : documento.signedUrl ? (
                      <a
                        href={documento.signedUrl}
                        className="font-body text-sm font-medium text-accent underline transition-colors hover:text-ink"
                      >
                        Baixar
                      </a>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                    {!documento.anonymized && (
                      <button
                        type="button"
                        disabled={processandoId === documento.id}
                        onClick={() => handleAcao('anonimizar', documento)}
                        title="Anonimizar este documento (apaga o arquivo e o vínculo com cliente/processo/tags)"
                        className="font-body text-sm font-medium text-ink-muted underline transition-colors hover:text-ink disabled:opacity-60"
                      >
                        Anonimizar
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={processandoId === documento.id}
                      onClick={() => handleAcao('excluir', documento)}
                      title="Excluir permanentemente este documento"
                      className="font-body text-sm font-medium text-danger underline transition-colors hover:text-ink disabled:opacity-60"
                    >
                      {processandoId === documento.id
                        ? 'Excluindo...'
                        : 'Excluir permanentemente'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pendente && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="acao-dialog-title"
          className="fixed inset-0 z-10 flex items-center justify-center bg-ink/50 px-4"
        >
          <div className="w-full max-w-lg rounded-lg border border-danger bg-surface p-6 shadow-xl">
            <h2
              id="acao-dialog-title"
              className="font-display text-xl font-semibold text-danger"
            >
              {ACAO_CONFIG[pendente.acao].titulo}
            </h2>
            <div className="mt-4 flex flex-col gap-3 font-body text-sm text-ink">
              <p>
                Você está prestes a {pendente.acao === 'excluir' ? 'excluir' : 'anonimizar'} o
                documento <strong>{pendente.documento.titulo}</strong>.
              </p>
              {pendente.acao === 'excluir' ? (
                <>
                  <p className="font-semibold text-danger">
                    Aviso 1: o arquivo será removido do Storage.
                  </p>
                  <p className="font-semibold text-danger">
                    Aviso 2: o registro será removido da base de dados.
                  </p>
                  <p className="font-semibold text-danger">
                    Aviso 3: todas as versões e o histórico serão apagados.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-danger">
                    Aviso 1: o arquivo e todo o histórico de versões serão
                    removidos do Storage — não vai dar para baixar depois.
                  </p>
                  <p className="font-semibold text-danger">
                    Aviso 2: cliente, processo, área e tags serão apagados do
                    registro.
                  </p>
                  <p className="font-semibold text-danger">
                    Aviso 3: o título e a categoria continuam visíveis — o
                    registro em si não é excluído.
                  </p>
                </>
              )}
              <p>Essa operação não pode ser desfeita.</p>
              {errorMsg && (
                <p className="rounded-md bg-danger-soft px-3 py-2 font-semibold text-danger">
                  {errorMsg}
                </p>
              )}
              <label className="flex flex-col gap-1 font-mono text-xs uppercase tracking-wide text-ink-muted">
                Digite {ACAO_CONFIG[pendente.acao].palavra} para confirmar
                <input
                  value={confirmacao}
                  onChange={(event) => setConfirmacao(event.target.value)}
                  autoFocus
                  className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm normal-case tracking-normal text-ink"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendente(null)}
                className="rounded-md border border-line px-3 py-2 font-body text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  confirmacao !== ACAO_CONFIG[pendente.acao].palavra ||
                  processandoId !== null
                }
                onClick={confirmarAcao}
                className="rounded-md bg-danger px-3 py-2 font-body text-sm font-semibold text-surface transition-colors hover:bg-danger/85 disabled:opacity-50 disabled:hover:bg-danger"
              >
                {processandoId
                  ? ACAO_CONFIG[pendente.acao].verboEmAndamento
                  : pendente.acao === 'excluir'
                    ? 'Excluir definitivamente'
                    : 'Anonimizar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
