import Image from 'next/image';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { SenhaInicialForm } from '@/components/senha-inicial-form';

const ERROR_MESSAGES: Record<string, string> = {
  confirmacao: 'A confirmação não bate com a nova senha.',
  fraca: 'A senha não atende aos requisitos.',
  servidor: 'Não foi possível salvar a senha. Tente novamente.',
};

export default async function DefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const cookieStore = await cookies();
  if (!cookieStore.get('definir-senha')) {
    redirect('/conta');
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
          Bem-vindo(a). Defina sua senha para começar a usar.
        </p>

        {erro && (
          <p className="mt-4 rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger">
            {ERROR_MESSAGES[erro] ?? 'Não foi possível salvar a senha.'}
          </p>
        )}

        <SenhaInicialForm />
      </div>
    </div>
  );
}
