'use client';

import { useState } from 'react';
import { PasswordField } from './password-field';
import { PasswordRequisitosChecklist } from './password-requisitos-checklist';
import { setInitialPassword } from '@/app/definir-senha/actions';
import { senhaAtendeRequisitos } from '@/lib/password';

export function SenhaInicialForm() {
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const confirmacaoDiferente = confirmacao !== '' && confirmacao !== senha;
  const podeSalvar = senhaAtendeRequisitos(senha) && confirmacao === senha;

  return (
    <form action={setInitialPassword} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="novaSenha"
          className="font-mono text-xs uppercase tracking-wide text-ink-muted"
        >
          Senha
        </label>
        <PasswordField
          id="novaSenha"
          name="novaSenha"
          autoComplete="new-password"
          onValueChange={setSenha}
        />
      </div>

      <PasswordRequisitosChecklist senha={senha} />

      <div className="flex flex-col gap-1">
        <label
          htmlFor="confirmarSenha"
          className="font-mono text-xs uppercase tracking-wide text-ink-muted"
        >
          Confirmar senha
        </label>
        <PasswordField
          id="confirmarSenha"
          name="confirmarSenha"
          autoComplete="new-password"
          onValueChange={setConfirmacao}
        />
        {confirmacaoDiferente && (
          <p className="font-body text-xs text-danger">
            As senhas não coincidem.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!podeSalvar}
        className="mt-2 rounded-md bg-accent px-4 py-2 font-body font-medium text-surface transition-colors hover:bg-accent/85 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-accent"
      >
        Salvar e entrar
      </button>
    </form>
  );
}
