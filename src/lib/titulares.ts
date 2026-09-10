export const DIREITO_LABELS: Record<string, string> = {
  confirmacao_tratamento: 'Confirmação de que tratamos seus dados',
  acesso: 'Acesso aos seus dados',
  correcao: 'Correção de dados incompletos ou desatualizados',
  anonimizacao_bloqueio_eliminacao:
    'Anonimização, bloqueio ou eliminação de dados desnecessários',
  portabilidade: 'Portabilidade dos dados',
  eliminacao_consentimento:
    'Eliminação dos dados (revogação de consentimento)',
  informacao_compartilhamento: 'Informação sobre compartilhamento com terceiros',
  outro: 'Outro',
};

export const DIREITO_OPTIONS = Object.entries(DIREITO_LABELS).map(
  ([value, label]) => ({ value, label })
);
