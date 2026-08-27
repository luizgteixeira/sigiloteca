'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateOficioConteudo } from '@/app/actions/documentos';

const PLACEHOLDER_REGEX = /\[[^\]\n]+\]/g;

export function OficioEditor({
  documentoId,
  workspaceId,
  conteudoInicial,
}: {
  documentoId: string;
  workspaceId: string;
  conteudoInicial: string;
}) {
  const router = useRouter();
  const [conteudo, setConteudo] = useState(conteudoInicial);
  const [salvando, setSalvando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const pendentes = useMemo(
    () => conteudo.match(PLACEHOLDER_REGEX)?.length ?? 0,
    [conteudo]
  );

  async function handleSalvar() {
    setErrorMsg(null);
    setSucesso(false);
    setSalvando(true);
    try {
      const result = await updateOficioConteudo({
        documentoId,
        workspaceId,
        conteudo,
      });
      if (result.error) {
        setErrorMsg(result.error);
        return;
      }
      setSucesso(true);
      router.refresh();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erro ao salvar o Ofício.'
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-line bg-surface p-5">
        <p className="font-body text-sm text-ink-muted">
          Substitua os campos entre colchetes pelo conteúdo real do Ofício,
          direto aqui na tela. Ao clicar em <strong>Salvar Ofício</strong>,
          este texto vira a versão atual do documento — não é preciso baixar
          nem reenviar nenhum arquivo.
        </p>
      </div>

      {pendentes > 0 ? (
        <p className="rounded-md bg-warning-soft px-3 py-2 font-body text-sm text-ink">
          Ainda {pendentes === 1 ? 'falta' : 'faltam'}{' '}
          <strong>{pendentes}</strong> campo{pendentes > 1 ? 's' : ''} entre
          colchetes para preencher.
        </p>
      ) : (
        <p className="rounded-md bg-success-soft px-3 py-2 font-body text-sm text-success">
          Todos os campos foram preenchidos.
        </p>
      )}

      {errorMsg && (
        <p className="rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger">
          {errorMsg}
        </p>
      )}
      {sucesso && (
        <p className="rounded-md bg-success-soft px-3 py-2 font-body text-sm text-success">
          Ofício salvo com sucesso. Você pode continuar editando ou voltar
          para a lista de documentos.
        </p>
      )}

      <textarea
        value={conteudo}
        onChange={(event) => setConteudo(event.target.value)}
        rows={24}
        spellCheck
        aria-label="Conteúdo do Ofício"
        className="rounded-lg border border-line bg-surface-2 p-4 font-mono text-sm leading-relaxed text-ink"
      />

      <div className="flex gap-3">
        <button
          type="button"
          disabled={salvando}
          onClick={handleSalvar}
          className="self-start rounded-md bg-accent px-4 py-2 font-body font-medium text-surface transition-colors hover:bg-accent/85 disabled:opacity-60 disabled:hover:bg-accent"
        >
          {salvando ? 'Salvando...' : 'Salvar Ofício'}
        </button>
      </div>
    </div>
  );
}
