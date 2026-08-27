import type { Metadata } from 'next';
import { Fraunces, Source_Sans_3, IBM_Plex_Mono } from 'next/font/google';
import { InactivityGuard } from '@/components/inactivity-guard';
import './globals.css';

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
});

const sourceSans = Source_Sans_3({
  variable: '--font-source-sans',
  subsets: ['latin'],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  weight: ['400', '500'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Sigiloteca',
  description: 'Gestão documental para advocacia',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${sourceSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <InactivityGuard />
        {children}
        <footer className="border-t border-line bg-surface px-4 py-5">
          <div className="mx-auto w-full max-w-4xl text-center">
            <p className="font-body text-sm text-ink-muted">
              © 2026 Sigiloteca · Desenvolvido por Luiz Gustavo ·{' '}
              <a
                href="https://luizgustavodev.com"
                target="_blank"
                rel="noreferrer"
                className="text-accent underline underline-offset-2 transition-colors hover:text-ink"
              >
                luizgustavodev.com
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
