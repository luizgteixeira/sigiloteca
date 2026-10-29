import Image from 'next/image';
import { signOut } from '@/app/actions';

// Usuário logado mas sem escritório: convite ainda não concluído ou
// removido da equipe. Nada do escritório aparece — o banco já não deixaria.
export function SemEscritorio() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-8">
        <div className="flex items-center gap-3">
          <Image src="/sigiloteca-icon.svg" alt="" width={44} height={44} />
          <h1 className="font-display text-2xl font-semibold text-ink">
            Sigiloteca
          </h1>
        </div>
        <p className="mt-4 font-body text-sm text-ink">
          Sua conta não faz parte de nenhum escritório no momento.
        </p>
        <p className="mt-2 font-body text-sm text-ink-muted">
          Se você foi removido da equipe por engano, ou ainda espera um
          convite, fale com um administrador do seu escritório.
        </p>
        <form action={signOut} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-md border border-line bg-surface px-4 py-2 font-body text-sm text-ink shadow-sm transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
          >
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}
