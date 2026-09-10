'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateCliente, deleteCliente } from '@/app/actions/clientes';

export type ClienteRow = {
  id: string;
  nome: string;
  endereco: string | null;
  email: string | null;
  celular: string | null;
  cpf: string | null;
  documentosVinculados: number;
};

export function ClienteList({
  clientes,
  workspaceId,
}: {
  clientes: ClienteRow[];
  workspaceId: string;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<ClienteRow | null>(null);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [excluindo, setExcluindo] = useState<ClienteRow | null>(null);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState('');

  async function handleSalvarEdicao(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editando) return;
    setEditErrorMsg(null);

    const formData = new FormData(event.currentTarget);
    setSalvando(true);
    try {
      const result = await updateCliente({
        id: editando.id,
        workspaceId,
        nome: String(formData.get('nome') ?? ''),
        endereco: String(formData.get('endereco') ?? ''),
        email: String(formData.get('email') ?? ''),
        celular: String(formData.get('celular') ?? ''),
        cpf: String(formData.get('cpf') ?? ''),
      });

      if (result.error !== null) {
        setEditErrorMsg(result.error);
        return;
      }

      setEditando(null);
      router.refresh();
    } catch (err) {
      setEditErrorMsg(
        err instanceof Error ? err.message : 'Erro ao salvar o cliente.'
      );
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    if (!excluindo || confirmacaoExclusao !== 'EXCLUIR') return;
    setDeleteErrorMsg(null);
    setDeletingId(excluindo.id);
    try {
      const result = await deleteCliente(excluindo.id, workspaceId);
      if (result.error !== null) {
        setDeleteErrorMsg(result.error);
        return;
      }
      setExcluindo(null);
      setConfirmacaoExclusao('');
      router.refresh();
    } catch (err) {
      setDeleteErrorMsg(
        err instanceof Error ? err.message : 'Erro ao excluir o cliente.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (clientes.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-surface p-5 font-body text-sm text-ink-muted">
        Nenhum cliente cadastrado.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[720px] font-body text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                Nome
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                Endereço
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                Email
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                Celular
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                CPF
              </th>
              <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted"></th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-ink">{cliente.nome}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {cliente.endereco ?? '—'}
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {cliente.email ?? '—'}
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {cliente.celular ?? '—'}
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {cliente.cpf ?? '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditErrorMsg(null);
                        setEditando(cliente);
                      }}
                      className="font-body text-sm font-medium text-accent underline transition-colors hover:text-ink"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteErrorMsg(null);
                        setConfirmacaoExclusao('');
                        setExcluindo(cliente);
                      }}
                      className="font-body text-sm font-medium text-danger underline transition-colors hover:text-ink"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="editar-cliente-title"
          className="fixed inset-0 z-10 flex items-center justify-center bg-ink/50 px-4"
        >
          <form
            onSubmit={handleSalvarEdicao}
            className="w-full max-w-lg rounded-lg border border-line bg-surface p-6 shadow-xl"
          >
            <h2
              id="editar-cliente-title"
              className="font-display text-xl font-semibold text-ink"
            >
              Editar cliente
            </h2>

            {editErrorMsg && (
              <p className="mt-4 rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger">
                {editErrorMsg}
              </p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                name="nome"
                type="text"
                required
                defaultValue={editando.nome}
                placeholder="Nome"
                aria-label="Nome"
                className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink sm:col-span-2"
              />
              <input
                name="endereco"
                type="text"
                defaultValue={editando.endereco ?? ''}
                placeholder="Endereço"
                aria-label="Endereço"
                className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink sm:col-span-2"
              />
              <input
                name="email"
                type="email"
                defaultValue={editando.email ?? ''}
                placeholder="Email"
                aria-label="Email"
                className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
              />
              <input
                name="celular"
                type="text"
                defaultValue={editando.celular ?? ''}
                placeholder="Celular"
                aria-label="Celular"
                className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
              />
              <input
                name="cpf"
                type="text"
                defaultValue={editando.cpf ?? ''}
                placeholder="CPF (opcional)"
                aria-label="CPF"
                className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditando(null)}
                className="rounded-md border border-line px-3 py-2 font-body text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="rounded-md bg-accent px-3 py-2 font-body text-sm font-semibold text-surface transition-colors hover:bg-accent/85 disabled:opacity-60"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {excluindo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="excluir-cliente-title"
          className="fixed inset-0 z-10 flex items-center justify-center bg-ink/50 px-4"
        >
          <div className="w-full max-w-lg rounded-lg border border-danger bg-surface p-6 shadow-xl">
            <h2
              id="excluir-cliente-title"
              className="font-display text-xl font-semibold text-danger"
            >
              Exclusão permanente
            </h2>
            <div className="mt-4 flex flex-col gap-3 font-body text-sm text-ink">
              <p>
                Você está prestes a excluir o cliente{' '}
                <strong>{excluindo.nome}</strong>.
              </p>
              <p className="font-semibold text-danger">
                Aviso 1: nome, endereço, e-mail, celular e CPF deste cliente
                serão apagados permanentemente do cadastro.
              </p>
              {excluindo.documentosVinculados > 0 ? (
                <p className="font-semibold text-danger">
                  Aviso 2: este cliente está vinculado a{' '}
                  {excluindo.documentosVinculados} documento
                  {excluindo.documentosVinculados > 1 ? 's' : ''}. Os
                  documentos NÃO são apagados — o nome permanece salvo
                  neles, só o vínculo com o cadastro do cliente é removido.
                </p>
              ) : (
                <p className="text-ink-muted">
                  Este cliente não está vinculado a nenhum documento.
                </p>
              )}
              <p>Essa operação não pode ser desfeita.</p>
              {deleteErrorMsg && (
                <p className="rounded-md bg-danger-soft px-3 py-2 font-semibold text-danger">
                  {deleteErrorMsg}
                </p>
              )}
              <label className="flex flex-col gap-1 font-mono text-xs uppercase tracking-wide text-ink-muted">
                Digite EXCLUIR para confirmar
                <input
                  value={confirmacaoExclusao}
                  onChange={(event) =>
                    setConfirmacaoExclusao(event.target.value)
                  }
                  autoFocus
                  className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm normal-case tracking-normal text-ink"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setExcluindo(null)}
                className="rounded-md border border-line px-3 py-2 font-body text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  confirmacaoExclusao !== 'EXCLUIR' ||
                  deletingId === excluindo.id
                }
                onClick={confirmarExclusao}
                className="rounded-md bg-danger px-3 py-2 font-body text-sm font-semibold text-surface transition-colors hover:bg-danger/85 disabled:opacity-50 disabled:hover:bg-danger"
              >
                {deletingId === excluindo.id
                  ? 'Excluindo...'
                  : 'Excluir definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
