'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type ClienteOption = { id: string; nome: string };

export function ClienteCombobox({
  clientes,
  name = 'clienteId',
  defaultValue,
  id,
  label = 'Cliente',
}: {
  clientes: ClienteOption[];
  name?: string;
  defaultValue?: string;
  id?: string;
  label?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    defaultValue ?? null
  );
  const [query, setQuery] = useState(
    () => clientes.find((c) => c.id === defaultValue)?.nome ?? ''
  );
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const termo = query.trim().toLowerCase();
    const lista = termo
      ? clientes.filter((c) => c.nome.toLowerCase().includes(termo))
      : clientes;
    return lista.slice(0, 50);
  }, [clientes, query]);

  function selecionar(cliente: ClienteOption) {
    setSelectedId(cliente.id);
    setQuery(cliente.nome);
    setOpen(false);
  }

  function limpar() {
    setSelectedId(null);
    setQuery('');
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const alvo = filtered[highlightedIndex];
      if (alvo) selecionar(alvo);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  const inputId = id ?? `${name}-combobox`;

  return (
    <div className="relative flex flex-col gap-1" ref={containerRef}>
      {label && (
        <label
          htmlFor={inputId}
          className="font-mono text-xs uppercase tracking-wide text-ink-muted"
        >
          {label}
        </label>
      )}
      <div className="flex items-center gap-1">
        <input
          id={inputId}
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedId(null);
            setOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          placeholder="Buscar cliente..."
          aria-label={label || 'Cliente'}
          className="w-full rounded-md border border-line bg-surface-2 px-3 py-2 font-body text-sm text-ink"
        />
        {selectedId && (
          <button
            type="button"
            onClick={limpar}
            aria-label="Limpar cliente selecionado"
            className="rounded-md border border-line px-2 py-2 font-body text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            ×
          </button>
        )}
      </div>
      <input type="hidden" name={name} value={selectedId ?? ''} />

      {open && (
        <ul className="absolute top-full z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-line bg-surface shadow-lg">
          {clientes.length === 0 ? (
            <li className="px-3 py-2 font-body text-sm text-ink-muted">
              Nenhum cliente cadastrado
            </li>
          ) : filtered.length === 0 ? (
            <li className="px-3 py-2 font-body text-sm text-ink-muted">
              Nenhum cliente encontrado
            </li>
          ) : (
            filtered.map((cliente, index) => (
              <li key={cliente.id}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selecionar(cliente)}
                  className={`block w-full px-3 py-2 text-left font-body text-sm ${
                    index === highlightedIndex
                      ? 'bg-accent-soft text-accent'
                      : 'text-ink hover:bg-surface-2'
                  }`}
                >
                  {cliente.nome}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
