import Image from 'next/image';
import { signIn } from './actions';
import { PasswordField } from '@/components/password-field';

function minutosAte(iso: string | undefined): number | null {
  if (!iso) return null;
  const alvo = new Date(iso).getTime();
  if (Number.isNaN(alvo)) return null;
  return Math.max(1, Math.ceil((alvo - Date.now()) / 60000));
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    motivo?: string;
    ate?: string;
    restantes?: string;
  }>;
}) {
  const { error, motivo, ate, restantes } = await searchParams;
  const minutosRestantes = minutosAte(ate);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-8">
        <div className="flex items-center gap-3">
          <Image
            src="/sigiloteca-icon.svg"
            alt=""
            width={52}
            height={52}
            priority
          />
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              Sigiloteca
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-wide text-accent">
              Gestão jurídica
            </p>
          </div>
        </div>
        <p className="mt-1 font-body text-sm text-ink-muted">
          Entre com seu email e senha.
        </p>

        {error === 'bloqueado' && (
          <p className="mt-4 rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger">
            Muitas tentativas de login. Conta temporariamente bloqueada —
            tente novamente em{' '}
            {minutosRestantes !== null
              ? `${minutosRestantes} minuto${minutosRestantes === 1 ? '' : 's'}`
              : 'alguns minutos'}
            .
          </p>
        )}
        {error && error !== 'bloqueado' && (
          <p className="mt-4 rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger">
            Email ou senha inválidos.
            {restantes &&
              ` Restam ${restantes} tentativa${restantes === '1' ? '' : 's'} antes do bloqueio temporário da conta.`}
          </p>
        )}
        {motivo === 'inatividade' && (
          <p className="mt-4 rounded-md bg-warning-soft px-3 py-2 font-body text-sm text-ink">
            Sua sessão expirou por inatividade. Entre novamente para
            continuar.
          </p>
        )}
        {motivo === 'sessoes_encerradas' && (
          <p className="mt-4 rounded-md bg-warning-soft px-3 py-2 font-body text-sm text-ink">
            Todas as sessões foram encerradas. Entre novamente para continuar.
          </p>
        )}

        <form action={signIn} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="font-mono text-xs uppercase tracking-wide text-ink-muted"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-ink"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="font-mono text-xs uppercase tracking-wide text-ink-muted"
            >
              Senha
            </label>
            <PasswordField />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-md bg-accent px-4 py-2 font-body font-medium text-surface transition-colors hover:bg-accent/85"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
