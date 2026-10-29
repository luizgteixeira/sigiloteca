// "?" ao lado de um ponto difícil da tela, levando direto ao tema certo em
// /ajuda. Abre em nova aba para não perder o que já foi preenchido.
export function AjudaLink({ tema, rotulo }: { tema: string; rotulo: string }) {
  return (
    <a
      href={`/ajuda#${tema}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Ajuda: ${rotulo} (abre em nova aba)`}
      title={`Ajuda: ${rotulo}`}
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line font-body text-xs font-semibold text-accent transition-colors hover:bg-surface-2"
    >
      ?
    </a>
  );
}
