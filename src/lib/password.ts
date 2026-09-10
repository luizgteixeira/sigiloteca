// Regras de senha compartilhadas entre a checklist visual (client) e a
// validação de verdade nas server actions — pra não bastar burlar a tela e
// mandar uma senha fraca direto.

export type RequisitoSenha = {
  chave: string;
  label: string;
  atende: (senha: string) => boolean;
};

export const REQUISITOS_SENHA: RequisitoSenha[] = [
  { chave: 'tamanho', label: 'Pelo menos 8 caracteres', atende: (s) => s.length >= 8 },
  { chave: 'minuscula', label: 'Uma letra minúscula', atende: (s) => /[a-z]/.test(s) },
  { chave: 'maiuscula', label: 'Uma letra maiúscula', atende: (s) => /[A-Z]/.test(s) },
  { chave: 'numero', label: 'Um número', atende: (s) => /[0-9]/.test(s) },
  {
    chave: 'especial',
    label: 'Um caractere especial (ex: ! @ # $ %)',
    atende: (s) => /[^A-Za-z0-9]/.test(s),
  },
];

export function senhaAtendeRequisitos(senha: string): boolean {
  return REQUISITOS_SENHA.every((requisito) => requisito.atende(senha));
}
