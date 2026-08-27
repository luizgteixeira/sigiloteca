import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getOrCreateWorkspace } from '@/lib/workspace';
import { ClienteForm } from '@/components/cliente-form';
import { ClienteList, type ClienteRow } from '@/components/cliente-list';

export default async function ClientesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const workspace = await getOrCreateWorkspace(supabase, user.id, user.email);

  const { data: clientes } = await supabase
    .from('cliente')
    .select('id, nome, endereco, email, celular, cpf')
    .eq('workspace_id', workspace.id)
    .order('nome');

  const { data: vinculos } = await supabase
    .from('documento')
    .select('cliente_id')
    .eq('workspace_id', workspace.id)
    .not('cliente_id', 'is', null);

  const vinculosPorCliente = new Map<string, number>();
  for (const vinculo of vinculos ?? []) {
    if (!vinculo.cliente_id) continue;
    vinculosPorCliente.set(
      vinculo.cliente_id,
      (vinculosPorCliente.get(vinculo.cliente_id) ?? 0) + 1
    );
  }

  const rows: ClienteRow[] = (clientes ?? []).map((cliente) => ({
    id: cliente.id,
    nome: cliente.nome,
    endereco: cliente.endereco,
    email: cliente.email,
    celular: cliente.celular,
    cpf: cliente.cpf,
    documentosVinculados: vinculosPorCliente.get(cliente.id) ?? 0,
  }));

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
              Clientes
            </p>
            <p className="font-body text-sm text-ink-muted">
              Cadastro de clientes · Sigiloteca
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

      <ClienteForm workspaceId={workspace.id} />
      <ClienteList clientes={rows} workspaceId={workspace.id} />
    </div>
  );
}
