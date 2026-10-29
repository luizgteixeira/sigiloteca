import { REQUISITOS_SENHA } from '@/lib/password';

export function PasswordRequisitosChecklist({ senha }: { senha: string }) {
  return (
    <ul className="flex flex-col gap-1">
      {REQUISITOS_SENHA.map((requisito) => {
        const atende = requisito.atende(senha);
        // Requisito cumprido ganha fundo, peso e ícone preenchido — só a cor
        // do texto não bastava: o verde da marca é escuro e se confundia com
        // o cinza dos itens pendentes.
        return (
          <li
            key={requisito.chave}
            className={`flex items-center gap-2 rounded-md px-2 py-1 font-body text-xs transition-colors ${
              atende
                ? 'bg-success-soft font-semibold text-success'
                : 'text-ink-muted'
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none ${
                atende ? 'bg-success text-surface' : 'border border-line'
              }`}
            >
              {atende ? '✓' : ''}
            </span>
            {requisito.label}
            <span className="sr-only">
              {atende ? '(cumprido)' : '(pendente)'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
