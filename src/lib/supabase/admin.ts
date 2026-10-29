import { createClient } from "@supabase/supabase-js";

// Cliente com a service role: ignora RLS e cria usuários no Auth. Só para
// server actions que já conferiram, antes, que quem pede é administrador
// do escritório (hoje: convite de membro). Nunca importar em código de
// cliente — a chave não tem prefixo NEXT_PUBLIC_ e não vai para o
// navegador.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    return null;
  }
  return createClient(url, chave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
