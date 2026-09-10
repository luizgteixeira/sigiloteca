import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  SolicitacoesTitularList,
  type SolicitacaoRow,
} from '@/components/solicitacoes-titular-list';

const LIMIT = 200;

export default async function SolicitacoesTitularPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: solicitacoes } = await supabase
    .from('solicitacao_titular')
    .select('id, nome, email, cpf, direito, descricao, status, created_at')
    .order('status', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(LIMIT);

  const rows = (solicitacoes ?? []) as SolicitacaoRow[];

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
              Solicitações de titulares
            </p>
            <p className="font-body text-sm text-ink-muted">
              Direitos LGPD (art. 18) · Sigiloteca
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

      <p className="font-body text-sm text-ink-muted">
        Solicitações enviadas pelo formulário público em{' '}
        <code className="font-mono text-xs">/titulares</code>. O retorno ao
        titular é manual, pelo e-mail que ele informou.
      </p>

      <SolicitacoesTitularList solicitacoes={rows} />
    </div>
  );
}
