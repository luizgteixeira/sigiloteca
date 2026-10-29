'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  alterarPapel,
  convidarMembro,
  gerarNovoLinkConvite,
  removerMembro,
  renomearEscritorio,
} from '@/app/equipe/actions';
import { formatarData } from '@/lib/datas';
import { PAPEIS, PAPEL_LABELS, type Papel } from '@/lib/permissoes';

export type MembroRow = {
  userId: string;
  email: string;
  papel: Papel;
  desde: string;
  souEu: boolean;
  // Ainda não aceitou o convite (nunca entrou).
  pendente: boolean;
};

function avisoSemEmail(
  email: string,
  motivo: 'nao_configurado' | 'falha' | undefined,
  detalhe?: string
): string {
  const porque =
    motivo === 'nao_configurado'
      ? 'o envio de e-mails ainda não está configurado no servidor'
      : `o servidor de e-mail recusou o envio${detalhe ? ` (código: ${detalhe})` : ''}`;
  return `Não foi possível mandar o e-mail para ${email}: ${porque}. Copie o link abaixo e envie você mesmo (WhatsApp, e-mail pessoal).`;
}

const BOTAO =
  'rounded-md bg-accent px-4 py-2 font-body text-sm font-medium text-surface transition-colors hover:bg-accent/85 disabled:opacity-50';
const CAMPO =
  'rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink';
const ROTULO = 'font-mono text-xs uppercase tracking-wide text-ink-muted';

export function EquipeGerenciar({
  nomeEscritorio,
  membros,
}: {
  nomeEscritorio: string;
  membros: MembroRow[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [linkManual, setLinkManual] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [removendo, setRemovendo] = useState<MembroRow | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function copiarLink() {
    if (!linkManual) return;
    try {
      await navigator.clipboard.writeText(linkManual);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissão de área de transferência: o campo continua lá para
      // selecionar e copiar à mão.
    }
  }

  async function aoGerarNovoLink(membro: MembroRow) {
    setOcupado(true);
    setErro(null);
    setAviso(null);
    setLinkManual(null);
    try {
      const resultado = await gerarNovoLinkConvite(membro.userId);
      if (resultado.error !== null) {
        setErro(resultado.error);
        return;
      }
      if (resultado.linkManual) {
        setLinkManual(resultado.linkManual);
        setAviso(
          avisoSemEmail(membro.email, resultado.motivoEmail, resultado.detalheEmail)
        );
      } else {
        setAviso(`Novo link de convite enviado para ${membro.email}.`);
      }
    } catch (falha) {
      console.error(falha);
      setErro('Não foi possível concluir agora. Recarregue a página (F5) e tente de novo.');
    } finally {
      setOcupado(false);
    }
  }

  async function executar(acao: () => Promise<{ error: string | null }>, sucesso: string) {
    setOcupado(true);
    setErro(null);
    setAviso(null);
    setLinkManual(null);
    try {
      const resultado = await acao();
      if (resultado.error !== null) {
        setErro(resultado.error);
        return false;
      }
      setAviso(sucesso);
      router.refresh();
      return true;
    } catch (falha) {
      console.error(falha);
      setErro('Não foi possível concluir agora. Recarregue a página (F5) e tente de novo.');
      return false;
    } finally {
      setOcupado(false);
    }
  }

  async function aoConvidar(formData: FormData) {
    const email = String(formData.get('email') ?? '');
    const papel = String(formData.get('papel') ?? '');
    setOcupado(true);
    setErro(null);
    setAviso(null);
    setLinkManual(null);
    try {
      const resultado = await convidarMembro(email, papel);
      if (resultado.error !== null) {
        setErro(resultado.error);
        return;
      }
      if (resultado.linkManual) {
        setLinkManual(resultado.linkManual);
        setAviso(avisoSemEmail(email, resultado.motivoEmail, resultado.detalheEmail));
      } else if (resultado.jaTinhaConta) {
        setAviso(`${email} já tinha conta e foi incluído(a) na equipe. Avisamos por e-mail.`);
      } else {
        setAviso(`Convite enviado para ${email}. O link vale por tempo limitado.`);
      }
      router.refresh();
    } catch (falha) {
      console.error(falha);
      setErro('Não foi possível concluir agora. Recarregue a página (F5) e tente de novo.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {erro && (
        <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger">
          {erro}
        </p>
      )}
      {aviso && (
        <div role="status" className="flex flex-col gap-2 rounded-md bg-success-soft px-3 py-2 font-body text-sm text-success">
          <p>{aviso}</p>
          {linkManual && (
            <div className="flex flex-wrap gap-2">
              <input
                readOnly
                value={linkManual}
                onFocus={(evento) => evento.currentTarget.select()}
                aria-label="Link de convite para copiar"
                className={`${CAMPO} min-w-0 flex-1 font-mono text-xs`}
              />
              <button type="button" onClick={copiarLink} className={BOTAO}>
                {copiado ? 'Copiado!' : 'Copiar link'}
              </button>
            </div>
          )}
        </div>
      )}

      <form
        action={async (formData) => {
          await executar(
            () => renomearEscritorio(String(formData.get('nome') ?? '')),
            'Nome do escritório atualizado.'
          );
        }}
        className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-6"
      >
        <label htmlFor="nome-escritorio" className={ROTULO}>
          Nome do escritório
        </label>
        <div className="flex flex-wrap gap-3">
          <input
            id="nome-escritorio"
            name="nome"
            defaultValue={nomeEscritorio}
            required
            maxLength={120}
            className={`${CAMPO} min-w-0 flex-1`}
          />
          <button type="submit" disabled={ocupado} className={BOTAO}>
            Salvar nome
          </button>
        </div>
      </form>

      <form
        action={aoConvidar}
        className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6"
      >
        <h2 className="font-display text-lg font-semibold text-ink">
          Convidar pessoa
        </h2>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-1">
            <label htmlFor="convite-email" className={ROTULO}>
              E-mail
            </label>
            <input
              id="convite-email"
              name="email"
              type="email"
              required
              autoComplete="off"
              className={CAMPO}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="convite-papel" className={ROTULO}>
              Papel
            </label>
            <select id="convite-papel" name="papel" defaultValue="assistente" className={CAMPO}>
              {PAPEIS.map((papel) => (
                <option key={papel} value={papel}>
                  {PAPEL_LABELS[papel]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" disabled={ocupado} className={`${BOTAO} self-start`}>
          {ocupado ? 'Enviando...' : 'Enviar convite'}
        </button>
      </form>

      <section className="rounded-lg border border-line bg-surface">
        <h2 className="border-b border-line px-6 py-4 font-display text-lg font-semibold text-ink">
          Membros ({membros.length})
        </h2>
        <ul>
          {membros.map((membro) => (
            <li
              key={membro.userId}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4 last:border-0"
            >
              <div className="min-w-0">
                <p className="break-all font-body text-sm font-medium text-ink">
                  {membro.email}
                  {membro.souEu && (
                    <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[10px] uppercase text-accent">
                      Você
                    </span>
                  )}
                  {membro.pendente && (
                    <span className="ml-2 rounded-full bg-warning-soft px-2 py-0.5 font-mono text-[10px] uppercase text-ink">
                      Convite pendente
                    </span>
                  )}
                </p>
                <p className="font-body text-xs text-ink-muted">
                  {membro.pendente
                    ? `Convidado em ${formatarData(membro.desde)} · ainda não criou a senha`
                    : `Na equipe desde ${formatarData(membro.desde)}`}
                </p>
                {membro.pendente && (
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => aoGerarNovoLink(membro)}
                    className="mt-1 font-body text-xs font-medium text-accent underline transition-colors hover:text-ink disabled:opacity-50"
                  >
                    Gerar novo link de convite
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <select
                  aria-label={`Papel de ${membro.email}`}
                  value={membro.papel}
                  disabled={ocupado}
                  onChange={(evento) => {
                    const novo = evento.target.value;
                    if (
                      membro.souEu &&
                      novo !== 'administrador' &&
                      !window.confirm(
                        'Você vai deixar de ser administrador e perder o acesso a esta tela. Continuar?'
                      )
                    ) {
                      evento.target.value = membro.papel;
                      return;
                    }
                    executar(
                      () => alterarPapel(membro.userId, novo),
                      `Papel de ${membro.email} alterado para ${PAPEL_LABELS[novo as Papel]}.`
                    );
                  }}
                  className={CAMPO}
                >
                  {PAPEIS.map((papel) => (
                    <option key={papel} value={papel}>
                      {PAPEL_LABELS[papel]}
                    </option>
                  ))}
                </select>
                {!membro.souEu && (
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => setRemovendo(membro)}
                    className="font-body text-sm font-medium text-danger underline transition-colors hover:text-ink disabled:opacity-50"
                  >
                    {membro.pendente ? 'Cancelar convite' : 'Remover'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {removendo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="remover-titulo"
          className="fixed inset-0 z-10 flex items-center justify-center bg-ink/50 px-4"
        >
          <div className="w-full max-w-md rounded-lg border border-danger bg-surface p-6 shadow-xl">
            <h2 id="remover-titulo" className="font-display text-xl font-semibold text-danger">
              {removendo.pendente ? 'Cancelar convite' : 'Remover da equipe'}
            </h2>
            <p className="mt-3 font-body text-sm text-ink">
              {removendo.pendente ? (
                <>
                  O convite para{' '}
                  <strong className="break-all">{removendo.email}</strong> deixa
                  de valer: mesmo que a pessoa use o link, não terá acesso ao
                  escritório. Dá para convidar de novo depois.
                </>
              ) : (
                <>
                  <strong className="break-all">{removendo.email}</strong> perde
                  o acesso a todos os documentos e clientes do escritório na
                  hora. Nada do que essa pessoa cadastrou é apagado, e ela pode
                  ser convidada de novo depois.
                </>
              )}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRemovendo(null)}
                className="rounded-md border border-line px-3 py-2 font-body text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={ocupado}
                onClick={async () => {
                  const membro = removendo;
                  const ok = await executar(
                    () => removerMembro(membro.userId),
                    `${membro.email} foi removido(a) da equipe.`
                  );
                  if (ok) setRemovendo(null);
                }}
                className="rounded-md bg-danger px-3 py-2 font-body text-sm font-semibold text-surface transition-colors hover:bg-danger/85 disabled:opacity-50"
              >
                {ocupado ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
