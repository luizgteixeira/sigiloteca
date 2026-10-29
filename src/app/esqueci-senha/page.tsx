import Image from 'next/image';
import Link from 'next/link';
import { solicitarRedefinicaoSenha } from './actions';

export default async function EsqueciSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string }>;
}) {
  const { enviado } = await searchParams;

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

        {enviado ? (
          <p className="mt-4 rounded-md bg-warning-soft px-3 py-2 font-body text-sm text-ink">
            Se existir uma conta com esse email, enviamos um link para
            redefinir a senha. Confira sua caixa de entrada (e a pasta de
            spam). O link vale por tempo limitado e deve ser aberto neste
            mesmo navegador.
          </p>
        ) : (
          <>
            <p className="mt-1 font-body text-sm text-ink-muted">
              Informe seu email e enviaremos um link para você criar uma nova
              senha.
            </p>

            <form
              action={solicitarRedefinicaoSenha}
              className="mt-6 flex flex-col gap-4"
            >
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
                  autoComplete="username"
                  className="rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-ink"
                />
              </div>

              <button
                type="submit"
                className="mt-2 rounded-md bg-accent px-4 py-2 font-body font-medium text-surface transition-colors hover:bg-accent/85"
              >
                Enviar link de redefinição
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center font-body text-sm">
          <Link href="/login" className="text-accent hover:underline">
            Voltar para o login
          </Link>
        </p>
      </div>
    </div>
  );
}
