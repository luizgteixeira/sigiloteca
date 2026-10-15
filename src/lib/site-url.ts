// Endereço público do site, para montar links e redirecionamentos.
// Atrás do proxy da Hostinger, request.url traz o endereço interno do
// processo Node (http://0.0.0.0:3000), que o navegador não alcança — por
// isso a ordem: variável de ambiente, depois os cabeçalhos repassados pelo
// proxy, e só então o endereço local de desenvolvimento.
export function origemPublica(headers: Headers): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  }

  const host = headers.get('x-forwarded-host') ?? headers.get('host');
  if (host && !host.startsWith('0.0.0.0')) {
    const proto =
      headers.get('x-forwarded-proto')?.split(',')[0].trim() ??
      (host.startsWith('localhost') ? 'http' : 'https');
    return `${proto}://${host}`;
  }

  return 'http://localhost:3000';
}
