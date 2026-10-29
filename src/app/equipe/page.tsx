import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEscritorio } from '@/lib/workspace';
import { PAPEIS, PAPEL_DESCRICOES, PAPEL_LABELS, pode, type Papel } from '@/lib/permissoes';
import { SemEscritorio } from '@/components/sem-escritorio';
import { AjudaLink } from '@/components/ajuda-link';
import { EquipeGerenciar, type MembroRow } from '@/components/equipe-gerenciar';

export default async function EquipePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const escritorio = await getEscritorio(supabase, user.id);
  if (!escritorio) {
    return <SemEscritorio />;
  }
  if (!pode(escritorio.papel, 'equipe')) {
    redirect('/');
  }

  const { data: membros } = await supabase
    .from('workspace_membro')
    .select('user_id, email, papel, created_at')
    .eq('workspace_id', escritorio.workspace.id)
    .order('created_at');

  // Convite pendente = a conta nunca entrou (não criou a senha pelo link).
  // last_sign_in_at só é legível pela service role; sem ela, o status fica
  // desconhecido e a tela não mostra o selo.
  const admin = createAdminClient();
  const jaEntrou = new Map<string, boolean>();
  if (admin) {
    await Promise.all(
      (membros ?? []).map(async (membro) => {
        const { data } = await admin.auth.admin.getUserById(membro.user_id);
        jaEntrou.set(membro.user_id, Boolean(data.user?.last_sign_in_at));
      })
    );
  }

  const rows: MembroRow[] = (membros ?? []).map((membro) => ({
    userId: membro.user_id,
    email: membro.email,
    papel: membro.papel as Papel,
    desde: membro.created_at,
    souEu: membro.user_id === user.id,
    pendente: jaEntrou.has(membro.user_id) && !jaEntrou.get(membro.user_id),
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-3 border-b border-line pb-5">
        <div className="flex items-center gap-3">
          <Image
            src="/sigiloteca-icon.svg"
            alt=""
            width={40}
            height={40}
            priority
          />
          <div>
            <h1 className="font-display text-xl font-semibold text-ink">
              Equipe
            </h1>
            <p className="font-body text-sm text-ink-muted">
              Quem tem acesso ao escritório · Sigiloteca
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="shrink-0 whitespace-nowrap rounded-md border border-line bg-surface px-3 py-2 font-body text-sm text-ink shadow-sm transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
        >
          ← Voltar
        </Link>
      </header>

      <EquipeGerenciar
        nomeEscritorio={escritorio.workspace.nome}
        membros={rows}
      />

      <section className="rounded-lg border border-line bg-surface p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          O que cada papel pode fazer
          <AjudaLink tema="equipe" rotulo="papéis da equipe" />
        </h2>
        <ul className="mt-3 flex flex-col gap-2 font-body text-sm">
          {PAPEIS.map((papel) => (
            <li key={papel}>
              <strong className="text-ink">{PAPEL_LABELS[papel]}:</strong>{' '}
              <span className="text-ink-muted">{PAPEL_DESCRICOES[papel]}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
