// Fundamentos de retenção da Matriz Jurídica de Retenção (Angela, 09/09/2026).
// Reter até uma data exige justificar por que — o sistema não presume
// sozinho qual prazo/motivo se aplica a cada documento.
export const RETENTION_BASIS_OPTIONS = [
  { value: 'active_purpose', label: 'Finalidade ainda ativa' },
  { value: 'legal_obligation', label: 'Obrigação legal ou regulatória' },
  { value: 'rights_defense', label: 'Exercício ou defesa de direitos' },
  { value: 'professional_record', label: 'Registro da atuação profissional' },
  { value: 'security_audit', label: 'Segurança ou auditoria' },
  { value: 'litigation_hold', label: 'Processo, disputa ou investigação em curso' },
  { value: 'archival', label: 'Arquivo histórico' },
] as const;
