import Image from 'next/image';
import Link from 'next/link';
import { signOutAllSessions } from './actions';
import { ChangePasswordForm } from '@/components/change-password-form';
import { MfaManager } from '@/components/mfa-manager';

const ERROR_MESSAGES: Record<string, string> = {
  sessoes: 'Não foi possível encerrar as sessões. Tente novamente.',
};

export default async function ContaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

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
              Sua conta
            </p>
            <p className="font-body text-sm text-ink-muted">
              Senha, autenticação e sessões · Sigiloteca
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

      <ChangePasswordForm />

      <MfaManager />

      <div className="flex max-w-sm flex-col gap-3 rounded-lg border border-line bg-surface p-6">
        <p className="font-body text-sm font-medium text-ink">
          Sessões ativas
        </p>
        {erro && (
          <p className="rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger">
            {ERROR_MESSAGES[erro] ?? 'Não foi possível encerrar as sessões.'}
          </p>
        )}
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
