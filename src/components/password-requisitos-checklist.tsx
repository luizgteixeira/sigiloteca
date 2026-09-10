import { REQUISITOS_SENHA } from '@/lib/password';

export function PasswordRequisitosChecklist({ senha }: { senha: string }) {
  return (
    <ul className="flex flex-col gap-1">
      {REQUISITOS_SENHA.map((requisito) => {
        const atende = requisito.atende(senha);
        return (
          <li
            key={requisito.chave}
            className={`flex items-center gap-2 font-body text-xs ${
              atende ? 'text-success' : 'text-ink-muted'
            }`}
          >
            <span aria-hidden="true">{atende ? '✓' : '○'}</span>
            {requisito.label}
          </li>
        );
      })}
    </ul>
  );
}
