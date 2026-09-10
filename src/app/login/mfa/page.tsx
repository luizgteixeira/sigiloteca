import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { verifyMfaChallenge } from './actions';

export default async function LoginMfaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel !== 'aal2' || aal.currentLevel === aal.nextLevel) {
    redirect('/');
  }

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
          Digite o código do seu app autenticador.
        </p>

        {error && (
          <p className="mt-4 rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger">
            Código inválido. Tente novamente.
          </p>
        )}

        <form
          action={verifyMfaChallenge}
          className="mt-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor="codigo"
              className="font-mono text-xs uppercase tracking-wide text-ink-muted"
            >
              Código de 6 dígitos
            </label>
            <input
              id="codigo"
              name="codigo"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              required
              className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-ink"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-md bg-accent px-4 py-2 font-body font-medium text-surface transition-colors hover:bg-accent/85"
          >
            Confirmar
          </button>
        </form>
      </div>
    </div>
  );
}
