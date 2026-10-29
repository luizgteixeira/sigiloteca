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

// Traduz a recusa do Supabase ao gravar a senha nova. Com "Prevent use of
// leaked passwords" ligado, senhas que aparecem em vazamentos conhecidos
// voltam como weak_password mesmo cumprindo os requisitos acima.
export type MotivoRecusaSenha = 'vazada' | 'igual' | 'servidor';

export function motivoRecusaSenha(
  code: string | undefined
): MotivoRecusaSenha {
  if (code === 'weak_password') return 'vazada';
  if (code === 'same_password') return 'igual';
  return 'servidor';
}
