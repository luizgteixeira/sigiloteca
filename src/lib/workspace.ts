import type { SupabaseClient } from "@supabase/supabase-js";
import { SEM_PERMISSAO, pode, type Papel, type Permissao } from "./permissoes";

export type Workspace = {
  id: string;
  owner_id: string;
  nome: string;
  created_at: string;
};

export type Escritorio = {
  workspace: Workspace;
  papel: Papel;
};

// O escritório do qual o usuário faz parte, e com qual papel. null = não é
// membro de nenhum (convite ainda não feito, ou foi removido da equipe) —
// as telas mostram <SemEscritorio /> nesse caso. Não cria escritório
// sozinho: desde a fase multiusuário, quem entra é convidado para um
// escritório existente.
export async function getEscritorio(
  supabase: SupabaseClient,
  userId: string,
): Promise<Escritorio | null> {
  const { data } = await supabase
    .from("workspace_membro")
    .select("papel, workspace:workspace_id (id, owner_id, nome, created_at)")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data?.workspace) {
    return null;
  }

  return {
    workspace: data.workspace as unknown as Workspace,
    papel: data.papel as Papel,
  };
}

// Para server actions: null se o usuário logado tem a permissão; senão a
// mensagem a devolver. O banco também recusa, mas a mensagem do banco não
// é para o usuário final.
export async function verificarPermissao(
  supabase: SupabaseClient,
  permissao: Permissao,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return SEM_PERMISSAO;
  }
  const escritorio = await getEscritorio(supabase, user.id);
  return pode(escritorio?.papel, permissao) ? null : SEM_PERMISSAO;
}
