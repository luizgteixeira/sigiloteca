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
  // "Mostrar" só revela o que a pessoa digitou (ou colou) nesta tela.
  // Senha preenchida pelo gerenciador do navegador não pode ser revelada:
  // ver uma senha salva no Edge/Chrome exige a senha do computador, e este
  // botão não pode virar um atalho que pula essa proteção — qualquer um
  // sentado na máquina veria a senha. Volta a valer quando o campo é
  // esvaziado e digitado de novo.
  const [preenchidaPeloNavegador, setPreenchidaPeloNavegador] = useState(false);

  function marcarAutopreenchimento() {
    // Só protege senha que já existe (login, senha atual). Em campo de
    // senha nova, o que o navegador preenche é a senha forte que ele acabou
    // de sugerir — ver o que foi gerado ajuda, e não há segredo antigo a
    // proteger.
    if (autoComplete !== 'current-password') return;
    setPreenchidaPeloNavegador(true);
    setVisible(false);
  }

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
            const valor = event.target.value;
            // Digitação, apagar e colar chegam como InputEvent com
            // inputType; o autopreenchimento chega sem inputType ou como
            // "insertReplacementText".
            const tipo = (event.nativeEvent as InputEvent).inputType;
            if (valor === '') {
              setPreenchidaPeloNavegador(false);
            } else if (!tipo || tipo === 'insertReplacementText') {
              marcarAutopreenchimento();
            }
            setPassword(valor);
            onValueChange?.(valor);
          }}
          // O Chrome/Edge às vezes preenche sem disparar evento nenhum até
          // a pessoa interagir com a página; a animação ligada a
          // :autofill (globals.css) avisa mesmo assim.
          onAnimationStart={(event) => {
            if (event.animationName === 'sigiloteca-autofill') {
              marcarAutopreenchimento();
            }
          }}
          onPaste={impedirColar}
          onDrop={impedirColar}
          className="w-full rounded-md border border-line bg-surface-2 px-3 py-2 pr-24 font-body text-ink"
        />
        {!preenchidaPeloNavegador && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute inset-y-0 right-2 my-auto h-8 px-2 font-body text-xs font-medium text-accent transition-colors hover:text-ink"
          >
            {visible ? 'Ocultar' : 'Mostrar'}
          </button>
        )}
      </div>
      {tentouColar && (
        <p role="alert" className="mt-1 font-body text-xs text-danger">
          Digite a senha novamente — colar não é permitido neste campo.
        </p>
      )}
    </div>
  );
}
