'use client';

import { useEffect, useState } from 'react';

// Botão flutuante que aparece depois de rolar a página e leva de volta ao
// topo — usado na ajuda, que é longa e tem a lista de temas lá em cima.
export function VoltarAoTopo() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const atualizar = () => setVisivel(window.scrollY > 400);
    atualizar();
    window.addEventListener('scroll', atualizar, { passive: true });
    return () => window.removeEventListener('scroll', atualizar);
  }, []);

  const subir = () => {
    const semAnimacao = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    window.scrollTo({ top: 0, behavior: semAnimacao ? 'auto' : 'smooth' });
    // Leva o foco junto, para quem navega pelo teclado continuar do topo.
    document.getElementById('topo')?.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      onClick={subir}
      aria-label="Voltar ao início da página"
      title="Voltar ao início"
      className={`fixed bottom-6 right-6 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-surface shadow-lg transition-all hover:bg-accent/85 ${
        visivel
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0'
      }`}
      tabIndex={visivel ? 0 : -1}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
