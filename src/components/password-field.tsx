'use client';

import { useState } from 'react';

export function PasswordField({
  id = 'password',
  name = 'password',
  autoComplete = 'current-password',
  onValueChange,
  bloquearColar = false,
}: {
  id?: string;
  name?: string;
  autoComplete?: string;
  onValueChange?: (value: string) => void;
  // Para o campo "confirmar senha": a confirmação só serve se a pessoa
  // digitar de novo — colar repete um erro de digitação da primeira vez.
  bloquearColar?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [tentouColar, setTentouColar] = useState(false);

  const impedirColar = (event: React.SyntheticEvent) => {
    if (!bloquearColar) return;
    event.preventDefault();
    setTentouColar(true);
  };

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            onValueChange?.(event.target.value);
          }}
          onPaste={impedirColar}
          onDrop={impedirColar}
          className="w-full rounded-md border border-line bg-surface-2 px-3 py-2 pr-24 font-body text-ink"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute inset-y-0 right-2 my-auto h-8 px-2 font-body text-xs font-medium text-accent transition-colors hover:text-ink"
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      {tentouColar && (
        <p role="alert" className="mt-1 font-body text-xs text-danger">
          Digite a senha novamente — colar não é permitido neste campo.
        </p>
      )}
    </div>
  );
}
