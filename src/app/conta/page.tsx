import Image from 'next/image';
import Link from 'next/link';
import { signOutAllSessions, updatePassword } from './actions';
import { PasswordField } from '@/components/password-field';
import { MfaManager } from '@/components/mfa-manager';

const ERROR_MESSAGES: Record<string, string> = {
  atual: 'Senha atual incorreta.',
  confirmacao: 'A confirmação não bate com a nova senha.',
  curta: 'A nova senha precisa ter pelo menos 8 caracteres.',
  servidor: 'Não foi possível trocar a senha. Tente novamente.',
  sessoes: 'Não foi possível encerrar as sessões. Tente novamente.',
};

export default async function ContaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; sucesso?: string }>;
}) {
  const { erro, sucesso } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between border-b border-line pb-5">
        <div className="flex items-center gap-3">
          <Image
            src="/sigiloteca-icon.svg"
            alt=""
            width={40}
            height={40}
            priority
          />
          <div>
            <p className="font-display text-xl font-semibold text-ink">
              Alterar senha
            </p>
            <p className="font-body text-sm text-ink-muted">
              Sua conta · Sigiloteca
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="rounded-md border border-line px-3 py-2 font-body text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          ← Voltar
        </Link>
      </header>

      <form
        action={updatePassword}
        className="flex max-w-sm flex-col gap-4 rounded-lg border border-line bg-surface p-6"
      >
        {erro && (
          <p className="rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger">
            {ERROR_MESSAGES[erro] ?? 'Não foi possível trocar a senha.'}
          </p>
        )}
        {sucesso && (
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
            id="novaSenha"
            name="novaSenha"
            autoComplete="new-password"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="confirmarSenha"
            className="font-mono text-xs uppercase tracking-wide text-ink-muted"
          >
            Confirmar nova senha
          </label>
          <PasswordField
            id="confirmarSenha"
            name="confirmarSenha"
            autoComplete="new-password"
          />
        </div>

        <p className="font-body text-xs text-ink-muted">
          Mínimo de 8 caracteres.
        </p>

        <button
          type="submit"
          className="mt-2 self-start rounded-md bg-accent px-4 py-2 font-body font-medium text-surface transition-colors hover:bg-accent/85"
        >
          Salvar nova senha
        </button>
      </form>

      <MfaManager />

      <div className="flex max-w-sm flex-col gap-3 rounded-lg border border-line bg-surface p-6">
        <p className="font-body text-sm font-medium text-ink">
          Sessões ativas
        </p>
        <p className="font-body text-xs text-ink-muted">
          Encerra o acesso em qualquer outro dispositivo ou navegador onde sua
          conta esteja logada, inclusive este. Você vai precisar entrar de
          novo aqui.
        </p>
        <form action={signOutAllSessions}>
          <button
            type="submit"
            className="rounded-md border border-danger px-4 py-2 font-body text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
          >
            Encerrar todas as sessões
          </button>
        </form>
      </div>
    </div>
  );
}
