'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Etapa = 'carregando' | 'inativo' | 'ativando' | 'ativo';

export function MfaManager() {
  const [etapa, setEtapa] = useState<Etapa>('carregando');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [codigo, setCodigo] = useState('');
  const [confirmacaoDesativar, setConfirmacaoDesativar] = useState('');
  const [mostrarDesativar, setMostrarDesativar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [carregandoAcao, setCarregandoAcao] = useState(false);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();
      if (ativo) {
        setEtapa(data && data.totp.length > 0 ? 'ativo' : 'inativo');
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  async function iniciarAtivacao() {
    setErro(null);
    setSucesso(null);
    setCarregandoAcao(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });
    setCarregandoAcao(false);

    if (error || !data) {
      setErro('Não foi possível iniciar a ativação. Tente novamente.');
      return;
    }

    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setEtapa('ativando');
  }

  async function cancelarAtivacao() {
    const supabase = createClient();
    if (factorId) {
      await supabase.auth.mfa.unenroll({ factorId });
    }
    setFactorId(null);
    setQrCode(null);
    setSecret(null);
    setCodigo('');
    setErro(null);
    setEtapa('inativo');
  }

  async function confirmarCodigo(event: React.FormEvent) {
    event.preventDefault();
    if (!factorId) return;

    setErro(null);
    setCarregandoAcao(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: codigo,
    });
    setCarregandoAcao(false);

    if (error) {
      setErro('Código inválido. Confira o app autenticador e tente de novo.');
      return;
    }

    setFactorId(null);
    setQrCode(null);
    setSecret(null);
    setCodigo('');
    setSucesso('Autenticação de dois fatores ativada.');
    setEtapa('ativo');
  }

  async function desativar() {
    setErro(null);
    setCarregandoAcao(true);
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    const fator = data?.totp[0];

    if (!fator) {
      setCarregandoAcao(false);
      setEtapa('inativo');
      return;
    }

    const { error } = await supabase.auth.mfa.unenroll({
      factorId: fator.id,
    });
    setCarregandoAcao(false);

    if (error) {
      setErro('Não foi possível desativar. Tente novamente.');
      return;
    }

    setMostrarDesativar(false);
    setConfirmacaoDesativar('');
    setSucesso('Autenticação de dois fatores desativada.');
    setEtapa('inativo');
  }

  if (etapa === 'carregando') {
    return null;
  }

  return (
    <div className="flex max-w-sm flex-col gap-3 rounded-lg border border-line bg-surface p-6">
      <p className="font-body text-sm font-medium text-ink">
        Autenticação de dois fatores
      </p>

      {erro && (
        <p className="rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger">
          {erro}
        </p>
      )}
      {sucesso && (
        <p className="rounded-md bg-success-soft px-3 py-2 font-body text-sm text-success">
          {sucesso}
        </p>
      )}

      {etapa === 'inativo' && (
        <>
          <p className="font-body text-xs text-ink-muted">
            Exige um código do seu app autenticador (Google Authenticator,
            Authy etc.) além da senha, a cada login.
          </p>
          <button
            type="button"
            onClick={iniciarAtivacao}
            disabled={carregandoAcao}
            className="self-start rounded-md bg-accent px-4 py-2 font-body text-sm font-medium text-surface transition-colors hover:bg-accent/85 disabled:opacity-60"
          >
            Ativar autenticação de dois fatores
          </button>
        </>
      )}

      {etapa === 'ativando' && qrCode && (
        <form onSubmit={confirmarCodigo} className="flex flex-col gap-3">
          <p className="font-body text-xs text-ink-muted">
            Escaneie o código com seu app autenticador, ou digite a chave
            manualmente, depois informe o código de 6 dígitos gerado.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCode}
            alt="Código QR para configurar o autenticador"
            width={180}
            height={180}
            className="self-start rounded-md border border-line bg-white p-2"
          />
          {secret && (
            <p className="break-all font-mono text-[11px] text-ink-muted">
              Chave manual: {secret}
            </p>
          )}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="mfa-codigo"
              className="font-mono text-xs uppercase tracking-wide text-ink-muted"
            >
              Código de 6 dígitos
            </label>
            <input
              id="mfa-codigo"
              name="codigo"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={codigo}
              onChange={(event) => setCodigo(event.target.value)}
              className="w-32 rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-ink"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={carregandoAcao || codigo.length === 0}
              className="rounded-md bg-accent px-4 py-2 font-body text-sm font-medium text-surface transition-colors hover:bg-accent/85 disabled:opacity-60"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={cancelarAtivacao}
              className="rounded-md border border-line px-4 py-2 font-body text-sm text-ink-muted transition-colors hover:bg-surface-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {etapa === 'ativo' && (
        <>
          <p className="font-body text-xs text-ink-muted">
            Ativa. Um código do seu app autenticador é exigido a cada login.
          </p>
          {!mostrarDesativar && (
            <button
              type="button"
              onClick={() => setMostrarDesativar(true)}
              className="self-start rounded-md border border-danger px-4 py-2 font-body text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
            >
              Desativar
            </button>
          )}
          {mostrarDesativar && (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="mfa-confirmar-desativar"
                className="font-body text-xs text-ink-muted"
              >
                Digite DESATIVAR para confirmar
              </label>
              <input
                id="mfa-confirmar-desativar"
                value={confirmacaoDesativar}
                onChange={(event) =>
                  setConfirmacaoDesativar(event.target.value)
                }
                className="w-40 rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-ink"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={desativar}
                  disabled={
                    carregandoAcao || confirmacaoDesativar !== 'DESATIVAR'
                  }
                  className="rounded-md border border-danger px-4 py-2 font-body text-sm font-medium text-danger transition-colors hover:bg-danger-soft disabled:opacity-60"
                >
                  Desativar definitivamente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarDesativar(false);
                    setConfirmacaoDesativar('');
                  }}
                  className="rounded-md border border-line px-4 py-2 font-body text-sm text-ink-muted transition-colors hover:bg-surface-2"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
