'use server';

import { createClient } from '@/lib/supabase/server';
import { getEscritorio } from '@/lib/workspace';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'document_create'
  | 'document_update'
  | 'document_delete'
  | 'document_export'
  | 'document_metadata_update'
  | 'document_anonymize'
  | 'client_create'
  | 'client_update'
  | 'client_delete'
  | 'member_invite'
  | 'member_role_change'
  | 'member_remove';

export type LogAuditEventOptions = {
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
};

// Best-effort: uma falha ao gravar o log não pode derrubar a ação real do
// usuário (upload, exclusão, login etc.), por isso engole o erro em vez de
// propagar.
export async function logAuditEvent(
  action: AuditAction,
  options?: LogAuditEventOptions
): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const escritorio = await getEscritorio(supabase, user.id);
    if (!escritorio) return;
    const { workspace } = escritorio;

    await supabase.from('audit_log').insert({
      workspace_id: workspace.id,
      user_id: user.id,
      user_email: user.email ?? null,
      action,
      resource_type: options?.resourceType ?? null,
      resource_id: options?.resourceId ?? null,
      metadata: options?.metadata ?? {},
    });
  } catch {
    // Ver comentário acima: log é melhor-esforço.
  }
}
