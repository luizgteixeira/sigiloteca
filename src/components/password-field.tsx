'use client';

import { useState } from 'react';

export function PasswordField({
  id = 'password',
  name = 'password',
  autoComplete = 'current-password',
  onValueChange,
}: {
  id?: string;
  name?: string;
  autoComplete?: string;
  onValueChange?: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [password, setPassword] = useState('');

  return (
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
  );
}
