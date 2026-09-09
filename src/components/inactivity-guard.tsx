'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logAuditEvent } from '@/app/actions/audit';

const TIMEOUT_MS = 2 * 60 * 60 * 1000;
const WARNING_MS = 60 * 1000;
const CHECK_INTERVAL_MS = 1000;

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'wheel',
  'touchstart',
] as const;

export function InactivityGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';
  const lastActivityRef = useRef(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const registrarAtividade = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const continuarConectada = useCallback(() => {
    registrarAtividade();
    setSecondsLeft(null);
  }, [registrarAtividade]);

  useEffect(() => {
    if (isLoginPage) return;

    lastActivityRef.current = Date.now();

    for (const evento of ACTIVITY_EVENTS) {
      window.addEventListener(evento, registrarAtividade, { passive: true });
    }

    const interval = setInterval(async () => {
      const decorrido = Date.now() - lastActivityRef.current;

      if (decorrido >= TIMEOUT_MS) {
        clearInterval(interval);
        await logAuditEvent('logout', { metadata: { motivo: 'inatividade' } });
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login?motivo=inatividade');
        router.refresh();
        return;
      }

      setSecondsLeft(
        decorrido >= TIMEOUT_MS - WARNING_MS
          ? Math.ceil((TIMEOUT_MS - decorrido) / 1000)
          : null
      );
    }, CHECK_INTERVAL_MS);

    return () => {
      for (const evento of ACTIVITY_EVENTS) {
        window.removeEventListener(evento, registrarAtividade);
      }
      clearInterval(interval);
    };
  }, [isLoginPage, registrarAtividade, router]);

  if (isLoginPage || secondsLeft === null) {
    return null;
  }

  const minutos = Math.floor(secondsLeft / 60);
  const segundos = secondsLeft % 60;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="inactivity-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4"
    >
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-6 shadow-xl">
        <h2
          id="inactivity-title"
          className="font-display text-lg font-semibold text-ink"
        >
          Sua sessão vai expirar
        </h2>
        <p className="mt-3 font-body text-sm text-ink-muted">
          Por segurança, a sessão vai expirar por inatividade em{' '}
          <strong className="text-ink">
            {minutos}:{segundos.toString().padStart(2, '0')}
          </strong>
          .
        </p>
        <button
          type="button"
          onClick={continuarConectada}
          className="mt-5 w-full rounded-md bg-accent px-4 py-2 font-body font-medium text-surface transition-colors hover:bg-accent/85"
        >
          Manter sessão ativa
        </button>
      </div>
    </div>
  );
}
