import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getOrCreateWorkspace } from '@/lib/workspace';
import {
  AUDIT_ACTION_LABELS,
  describeAuditEvent,
  type AuditLogRow,
} from '@/lib/audit-log';

const LIMIT = 200;

export default async function AuditoriaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const workspace = await getOrCreateWorkspace(supabase, user.id, user.email);

  const { data: eventos } = await supabase
    .from('audit_log')
    .select('id, action, resource_type, user_email, metadata, created_at')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })
    .limit(LIMIT);

  const rows = (eventos ?? []) as AuditLogRow[];

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
              Auditoria
            </p>
            <p className="font-body text-sm text-ink-muted">
              Registro de operações · Sigiloteca
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
        Últimos {LIMIT} eventos registrados neste escritório: login/logout,
        criação, alteração e exclusão de documentos e clientes, e
        exportações. Esse registro não pode ser alterado nem apagado pela
        aplicação.
      </p>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-5 font-body text-sm text-ink-muted">
          Nenhum evento registrado ainda.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[560px] font-body text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                  Data/hora
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                  Ação
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                  Quem
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                  Detalhes
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((evento) => (
                <tr
                  key={evento.id}
                  className="border-b border-line last:border-0"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                    {new Date(evento.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-accent-soft px-2 py-1 font-mono text-xs text-accent">
                      {AUDIT_ACTION_LABELS[evento.action]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {evento.user_email ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {describeAuditEvent(evento)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
