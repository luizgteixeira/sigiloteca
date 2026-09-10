'use client';

import { useActionState, useState } from 'react';
import { PasswordField } from './password-field';
import { PasswordRequisitosChecklist } from './password-requisitos-checklist';
import { updatePassword, type UpdatePasswordState } from '@/app/conta/actions';

const ERROR_MESSAGES: Record<string, string> = {
  atual: 'Senha atual incorreta.',
  confirmacao: 'A confirmação não bate com a nova senha.',
  fraca: 'A nova senha não atende aos requisitos abaixo.',
  servidor: 'Não foi possível trocar a senha. Tente novamente.',
};

const initialState: UpdatePasswordState = { resetToken: 0 };

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(updatePassword, initialState);
  const [novaSenha, setNovaSenha] = useState('');
  const [resetTokenVisto, setResetTokenVisto] = useState(state.resetToken);

  // Ajuste de estado durante a renderização (não em efeito): quando a troca
  // dá certo e os campos são limpos (resetToken muda), a checklist também
  // volta a zero, em vez de continuar mostrando os requisitos da senha
  // antiga que acabou de ser trocada.
  if (state.resetToken !== resetTokenVisto) {
    setResetTokenVisto(state.resetToken);
    setNovaSenha('');
  }

  return (
    <form
      action={formAction}
      className="flex max-w-sm flex-col gap-4 rounded-lg border border-line bg-surface p-6"
    >
      {state.erro && (
        <p className="rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger">
          {ERROR_MESSAGES[state.erro] ?? 'Não foi possível trocar a senha.'}
        </p>
      )}
      {state.sucesso && (
        <p className="rounded-md bg-success-soft px-3 py-2 font-body text-sm text-success">
          Senha alterada com sucesso.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label
          htmlFor="senhaAtual"
          className="font-mono text-xs uppercase tracking-wide text-ink-muted"
        >
          Senha atual
        </label>
        <PasswordField
          key={`atual-${state.resetToken}`}
          id="senhaAtual"
          name="senhaAtual"
          autoComplete="current-password"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="novaSenha"
          className="font-mono text-xs uppercase tracking-wide text-ink-muted"
        >
          Nova senha
        </label>
        <PasswordField
          key={`nova-${state.resetToken}`}
          id="novaSenha"
          name="novaSenha"
          autoComplete="new-password"
          onValueChange={setNovaSenha}
        />
      </div>

      <PasswordRequisitosChecklist senha={novaSenha} />

      <div className="flex flex-col gap-1">
        <label
          htmlFor="confirmarSenha"
          className="font-mono text-xs uppercase tracking-wide text-ink-muted"
        >
          Confirmar nova senha
        </label>
        <PasswordField
          key={`confirmar-${state.resetToken}`}
          id="confirmarSenha"
          name="confirmarSenha"
          autoComplete="new-password"
        />
      </div>

      <button
        type="submit"
        className="mt-2 self-start rounded-md bg-accent px-4 py-2 font-body font-medium text-surface transition-colors hover:bg-accent/85"
      >
        Salvar nova senha
      </button>
    </form>
  );
}
