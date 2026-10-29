'use client';

import { useEffect } from 'react';

// Depois de um deploy, uma aba aberta antes dele pode ter páginas
// pré-carregadas que apontam para arquivos JavaScript/CSS da versão antiga —
// e a Hostinger apaga esses arquivos a cada deploy. Clicar no link então
// falha em silêncio (ChunkLoadError) e "nada acontece". Aqui a página
// recarrega sozinha, já na versão nova. A trava de 30s evita ficar em
// loop se o erro tiver outra causa.
const CHAVE = 'sigiloteca:recarregou-por-chunk';
const INTERVALO_MINIMO_MS = 30_000;

function ehErroDeChunk(erro: unknown): boolean {
  if (!erro || typeof erro !== 'object') return false;
  const { name, message } = erro as { name?: unknown; message?: unknown };
  return (
    name === 'ChunkLoadError' ||
    (typeof message === 'string' &&
      /Loading (CSS )?chunk .+ failed/.test(message))
  );
}

function recarregarUmaVez() {
  try {
    const ultima = Number(sessionStorage.getItem(CHAVE) ?? 0);
    if (Date.now() - ultima < INTERVALO_MINIMO_MS) return;
    sessionStorage.setItem(CHAVE, String(Date.now()));
  } catch {
    // Sem sessionStorage (modo privado restrito): recarrega mesmo assim —
    // um erro de chunk não se resolve sozinho.
  }
  window.location.reload();
}

export function RecarregarAposDeploy() {
  useEffect(() => {
    const aoErro = (evento: ErrorEvent) => {
      if (ehErroDeChunk(evento.error)) recarregarUmaVez();
    };
    const aoRejeitar = (evento: PromiseRejectionEvent) => {
      if (ehErroDeChunk(evento.reason)) recarregarUmaVez();
    };
    window.addEventListener('error', aoErro);
    window.addEventListener('unhandledrejection', aoRejeitar);
    return () => {
      window.removeEventListener('error', aoErro);
      window.removeEventListener('unhandledrejection', aoRejeitar);
    };
  }, []);

  return null;
}
