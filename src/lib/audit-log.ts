import { CATEGORIA_LABELS } from '@/components/document-list';
import type { AuditAction } from '@/app/actions/audit';

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  login: 'Login',
  logout: 'Logout',
  document_create: 'Documento criado',
  document_update: 'Documento alterado',
  document_delete: 'Documento excluído',
  document_export: 'Exportação de documentos',
  client_create: 'Cliente cadastrado',
  client_update: 'Cliente alterado',
  client_delete: 'Cliente excluído',
};

export type AuditLogRow = {
  id: string;
  action: AuditAction;
  resource_type: string | null;
  user_email: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

function categoriaLabel(metadata: Record<string, unknown>): string | null {
  const categoria = metadata.categoria;
  if (typeof categoria !== 'string') return null;
  return CATEGORIA_LABELS[categoria] ?? categoria;
}

function alteracoesTexto(metadata: Record<string, unknown>): string | null {
  const alteracoes = metadata.alteracoes;
  if (!alteracoes || typeof alteracoes !== 'object') return null;
  const entradas = Object.entries(
    alteracoes as Record<string, { de: unknown; para: unknown }>
  );
  if (entradas.length === 0) return null;
  return entradas
    .map(([campo, { de, para }]) => `${campo}: ${de ?? '—'} → ${para ?? '—'}`)
    .join('; ');
}

// Descrição de uma linha em uma frase — o que a tela de auditoria mostra na
// coluna "Detalhes", já que o metadata bruto varia por tipo de evento.
export function describeAuditEvent(row: AuditLogRow): string {
  const { action, metadata } = row;
  const titulo = typeof metadata.titulo === 'string' ? metadata.titulo : null;
  const nome = typeof metadata.nome === 'string' ? metadata.nome : null;
  const categoria = categoriaLabel(metadata);

  switch (action) {
    case 'document_create':
    case 'document_update':
    case 'document_delete':
      return [titulo && `"${titulo}"`, categoria].filter(Boolean).join(' · ') || '—';
    case 'document_export': {
      const quantidade = metadata.quantidade;
      return typeof quantidade === 'number'
        ? `${quantidade} documento${quantidade === 1 ? '' : 's'}`
        : '—';
    }
    case 'client_create':
    case 'client_delete':
      return nome ? `"${nome}"` : '—';
    case 'client_update': {
      const diff = alteracoesTexto(metadata);
      return [nome && `"${nome}"`, diff].filter(Boolean).join(' — ') || '—';
    }
    case 'logout': {
      const motivo = metadata.motivo;
      return motivo === 'inatividade' ? 'Por inatividade' : '—';
    }
    case 'login':
      return '—';
  }
}
