import Image from 'next/image';
import { SolicitacaoTitularForm } from '@/components/solicitacao-titular-form';

export default function TitularesPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-bg px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3">
          <Image
            src="/sigiloteca-icon.svg"
            alt=""
            width={44}
            height={44}
            priority
          />
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              Direitos sobre seus dados
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-wide text-accent">
              Sigiloteca
            </p>
          </div>
        </div>
        <p className="mt-3 font-body text-sm text-ink-muted">
          Se você é cliente, parte de um processo ou qualquer pessoa cujos
          dados pessoais este escritório trate, use este formulário para
          solicitar confirmação, acesso, correção, eliminação ou outros
          direitos previstos na LGPD (Lei nº 13.709/2018).
        </p>

        <div className="mt-6">
          <SolicitacaoTitularForm />
        </div>
      </div>
    </div>
  );
}
