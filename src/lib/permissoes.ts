// Matriz de papéis do escritório. O banco reforça as mesmas regras nas
// policies (supabase/migrations/20261029000017_equipe_escritorio.sql) —
// esta é a versão para a tela e as server actions decidirem o que mostrar
// e recusarem cedo, com mensagem clara.

export type Papel = 'administrador' | 'advogado' | 'assistente';

export type Permissao =
  // excluir e anonimizar documentos, excluir clientes
  | 'acoes_permanentes'
  | 'exportar'
  | 'auditoria'
  | 'equipe'
  | 'titulares';

const MATRIZ: Record<Permissao, Papel[]> = {
  acoes_permanentes: ['administrador'],
  exportar: ['administrador'],
  auditoria: ['administrador'],
  equipe: ['administrador'],
  titulares: ['administrador', 'advogado'],
};

export function pode(papel: Papel | null | undefined, permissao: Permissao) {
  return papel != null && MATRIZ[permissao].includes(papel);
}

export const PAPEL_LABELS: Record<Papel, string> = {
  administrador: 'Administrador',
  advogado: 'Advogado',
  assistente: 'Assistente',
};

export const PAPEL_DESCRICOES: Record<Papel, string> = {
  administrador:
    'Tudo, inclusive equipe, auditoria, exportação, exclusão e anonimização.',
  advogado:
    'Documentos e clientes (ver, baixar, enviar, editar) e solicitações de titulares.',
  assistente: 'Documentos e clientes (ver, baixar, enviar, editar).',
};

export const PAPEIS: Papel[] = ['administrador', 'advogado', 'assistente'];

export const SEM_PERMISSAO =
  'Você não tem permissão para fazer isso. Fale com um administrador do escritório.';
