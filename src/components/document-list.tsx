'use client';

import { useState } from 'react';
import Link from 'next/link';
import { deleteDocumento } from '@/app/actions/documentos';

const CATEGORIA_LABELS: Record<string, string> = {
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
};

function motivoBloqueio(documento: DocumentoRow): string | null {
  if (documento.legalHold) {
    return 'Este documento está sob preservação especial (legal hold) e não pode ser excluído.';
  }
  if (
    documento.retentionUntil &&
    new Date(documento.retentionUntil).getTime() > Date.now()
  ) {
    return `Este documento está retido até ${new Date(documento.retentionUntil).toLocaleDateString('pt-BR')} e não pode ser excluído.`;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [documentoPendente, setDocumentoPendente] =
    useState<DocumentoRow | null>(null);
  const [confirmacao, setConfirmacao] = useState('');

  async function handleDelete(documento: DocumentoRow) {
    const bloqueio = motivoBloqueio(documento);
    if (bloqueio) {
      setErrorMsg(bloqueio);
      setDocumentoPendente(null);
      return;
    }
    setErrorMsg(null);
    setConfirmacao('');
    setDocumentoPendente(documento);
  }

  async function confirmDelete() {
    if (!documentoPendente || confirmacao !== 'EXCLUIR') return;

    setDeletingId(documentoPendente.id);
    try {
      const result = await deleteDocumento(documentoPendente.id, workspaceId);
      if (result.error) {
        setErrorMsg(result.error);
        return;
      }
      setDocumentoPendente(null);
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : 'Erro ao excluir o documento.'
      );
    } finally {
      setDeletingId(null);
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
        arquivo, o registro da base de dados e todo o histórico de versões. Essa
        ação é permanente e não pode ser desfeita.
      </aside>
      {!documentoPendente && errorMsg && (
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
                <td className="px-4 py-3 text-ink">{documento.titulo}</td>
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
                    !documento.isModeloPadrao ? (
                      <Link
                        href={`/documentos/${documento.id}/editar`}
                        className="font-body text-sm font-medium text-accent underline transition-colors hover:text-ink"
                      >
                        Editar
                      </Link>
                    ) : null}
                    {documento.signedUrl ? (
                      <a
                        href={documento.signedUrl}
                        className="font-body text-sm font-medium text-accent underline transition-colors hover:text-ink"
                      >
                        Baixar
                      </a>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                    <button
                      type="button"
                      disabled={deletingId === documento.id}
                      onClick={() => handleDelete(documento)}
                      title="Excluir permanentemente este documento"
                      className="font-body text-sm font-medium text-danger underline transition-colors hover:text-ink disabled:opacity-60"
                    >
                      {deletingId === documento.id
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
      {documentoPendente && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-10 flex items-center justify-center bg-ink/50 px-4"
        >
          <div className="w-full max-w-lg rounded-lg border border-danger bg-surface p-6 shadow-xl">
            <h2
              id="delete-dialog-title"
              className="font-display text-xl font-semibold text-danger"
            >
              Exclusão permanente
            </h2>
            <div className="mt-4 flex flex-col gap-3 font-body text-sm text-ink">
              <p>
                Você está prestes a excluir o documento{' '}
                <strong>{documentoPendente.titulo}</strong>.
              </p>
              <p className="font-semibold text-danger">
                Aviso 1: o arquivo será removido do Storage.
              </p>
              <p className="font-semibold text-danger">
                Aviso 2: o registro será removido da base de dados.
              </p>
              <p className="font-semibold text-danger">
                Aviso 3: todas as versões e o histórico serão apagados.
              </p>
              <p>Essa operação não pode ser desfeita.</p>
              {errorMsg && (
                <p className="rounded-md bg-danger-soft px-3 py-2 font-semibold text-danger">
                  {errorMsg}
                </p>
              )}
              <label className="flex flex-col gap-1 font-mono text-xs uppercase tracking-wide text-ink-muted">
                Digite EXCLUIR para confirmar
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
                onClick={() => setDocumentoPendente(null)}
                className="rounded-md border border-line px-3 py-2 font-body text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={confirmacao !== 'EXCLUIR' || deletingId !== null}
                onClick={confirmDelete}
                className="rounded-md bg-danger px-3 py-2 font-body text-sm font-semibold text-surface transition-colors hover:bg-danger/85 disabled:opacity-50 disabled:hover:bg-danger"
              >
                {deletingId ? 'Excluindo...' : 'Excluir definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
