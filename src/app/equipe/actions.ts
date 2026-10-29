'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEscritorio } from '@/lib/workspace';
import { PAPEIS, PAPEL_LABELS, SEM_PERMISSAO, pode, type Papel } from '@/lib/permissoes';
import { origemPublica } from '@/lib/site-url';
import { enviarEmail } from '@/lib/aviso-email';
import { logAuditEvent } from '@/app/actions/audit';
import type { ActionResult } from '@/app/actions/documentos';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Quando o e-mail não sai, a tela mostra o link para o administrador
// repassar, e diz por quê: SMTP_* ausente no servidor é configuração;
// falha no envio é problema da caixa/servidor de e-mail.
type ResultadoConvite = {
  linkManual?: string;
  motivoEmail?: 'nao_configurado' | 'falha';
};

async function enviarOuDevolverLink(
  para: string,
  texto: string,
  link: string | null
): Promise<ResultadoConvite> {
  try {
    const enviado = await enviarEmail({
      para,
      assunto: 'Convite para o Sigiloteca',
      texto,
    });
    if (!enviado) {
      console.warn('E-mail de convite não enviado: SMTP não configurado.');
      return link ? { linkManual: link, motivoEmail: 'nao_configurado' } : {};
    }
    return {};
  } catch (erro) {
    console.error('Falha ao enviar e-mail de convite:', erro);
    return link ? { linkManual: link, motivoEmail: 'falha' } : {};
  }
}

function linkDefinirSenha(origem: string, tokenHash: string, tipo: string) {
  const url = new URL('/auth/confirm', origem);
  url.searchParams.set('token_hash', tokenHash);
  url.searchParams.set('type', tipo);
  url.searchParams.set('next', '/definir-senha');
  return url.toString();
}
const ULTIMO_ADMIN = 'pelo menos um administrador';

async function exigirAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const escritorio = await getEscritorio(supabase, user.id);
  if (!escritorio || !pode(escritorio.papel, 'equipe')) return null;
  return { supabase, user, escritorio };
}

function mensagemDoBanco(mensagem: string): string {
  return mensagem.includes(ULTIMO_ADMIN)
    ? 'O escritório precisa de pelo menos um administrador. Promova outra pessoa antes.'
    : 'Não foi possível concluir. Recarregue a página e tente de novo.';
}

// Convida por e-mail. Conta nova: cria o usuário no Auth (service role) e
// manda o link de convite, que cai em /definir-senha. Conta que já existe
// (sem escritório): só a inclui na equipe e avisa por e-mail. Se o e-mail
// não puder ser enviado, devolve o link para o administrador repassar.
export async function convidarMembro(
  emailBruto: string,
  papelBruto: string
): Promise<ActionResult<ResultadoConvite & { jaTinhaConta?: boolean }>> {
  const ctx = await exigirAdmin();
  if (!ctx) return { error: SEM_PERMISSAO };

  const email = emailBruto.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    return { error: 'Informe um e-mail válido.' };
  }
  if (!PAPEIS.includes(papelBruto as Papel)) {
    return { error: 'Escolha um papel.' };
  }
  const papel = papelBruto as Papel;

  const admin = createAdminClient();
  if (!admin) {
    return {
      error:
        'Convites ainda não estão configurados no servidor (falta SUPABASE_SERVICE_ROLE_KEY). Fale com o responsável técnico.',
    };
  }

  const origem = origemPublica(await headers());
  let userId: string;
  let linkConvite: string | null = null;

  const convite = await admin.auth.admin.generateLink({ type: 'invite', email });
  if (!convite.error) {
    userId = convite.data.user.id;
    linkConvite = linkDefinirSenha(
      origem,
      convite.data.properties.hashed_token,
      convite.data.properties.verification_type
    );
  } else {
    // Conta já existe no Auth: descobre o id sem gerar convite.
    const existente = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });
    if (existente.error) {
      console.error('Falha ao convidar membro:', convite.error, existente.error);
      return { error: 'Não foi possível criar o convite. Tente de novo.' };
    }
    userId = existente.data.user.id;
  }

  const { data: jaMembro } = await admin
    .from('workspace_membro')
    .select('workspace_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (jaMembro) {
    return {
      error:
        jaMembro.workspace_id === ctx.escritorio.workspace.id
          ? 'Essa pessoa já faz parte da equipe.'
          : 'Essa pessoa já faz parte de outro escritório no Sigiloteca.',
    };
  }

  const { error: insertError } = await admin.from('workspace_membro').insert({
    workspace_id: ctx.escritorio.workspace.id,
    user_id: userId,
    email,
    papel,
    convidado_por: ctx.user.id,
  });
  if (insertError) {
    console.error('Falha ao incluir membro:', insertError);
    return { error: 'Não foi possível incluir essa pessoa. Tente de novo.' };
  }

  await logAuditEvent('member_invite', {
    resourceType: 'membro',
    resourceId: userId,
    metadata: { email, papel },
  });
  revalidatePath('/equipe');

  const nomeEscritorio = ctx.escritorio.workspace.nome;
  const texto = linkConvite
    ? [
        `Você foi convidado(a) para a equipe "${nomeEscritorio}" no Sigiloteca, como ${PAPEL_LABELS[papel]}.`,
        '',
        'Para começar, crie sua senha por este link (vale por tempo limitado e só pode ser usado uma vez):',
        linkConvite,
        '',
        'Se você não esperava este convite, ignore este e-mail.',
      ].join('\n')
    : [
        `Você foi incluído(a) na equipe "${nomeEscritorio}" no Sigiloteca, como ${PAPEL_LABELS[papel]}.`,
        '',
        `Entre com seu e-mail e sua senha de sempre em ${origem}/login`,
      ].join('\n');

  const envio = await enviarOuDevolverLink(email, texto, linkConvite);
  return { error: null, ...envio, jaTinhaConta: !linkConvite };
}

// Convite ainda não aceito (a pessoa nunca entrou): gera um link novo para
// criar a senha — o anterior expira ou pode ter se perdido. Usa o tipo
// "recovery" porque a conta já existe; o caminho é o mesmo
// (/auth/confirm → /definir-senha).
export async function gerarNovoLinkConvite(
  userId: string
): Promise<ActionResult<ResultadoConvite>> {
  const ctx = await exigirAdmin();
  if (!ctx) return { error: SEM_PERMISSAO };

  const { data: membro } = await ctx.supabase
    .from('workspace_membro')
    .select('email, papel')
    .eq('workspace_id', ctx.escritorio.workspace.id)
    .eq('user_id', userId)
    .maybeSingle();
  if (!membro) return { error: 'Membro não encontrado.' };

  const admin = createAdminClient();
  if (!admin) {
    return {
      error:
        'Convites ainda não estão configurados no servidor (falta SUPABASE_SERVICE_ROLE_KEY). Fale com o responsável técnico.',
    };
  }

  const { data: conta } = await admin.auth.admin.getUserById(userId);
  if (conta.user?.last_sign_in_at) {
    return { error: 'Essa pessoa já aceitou o convite e entra com a própria senha.' };
  }

  const gerado = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: membro.email,
  });
  if (gerado.error) {
    console.error('Falha ao gerar novo link de convite:', gerado.error);
    return { error: 'Não foi possível gerar o link. Tente de novo.' };
  }

  const origem = origemPublica(await headers());
  const link = linkDefinirSenha(
    origem,
    gerado.data.properties.hashed_token,
    gerado.data.properties.verification_type
  );

  await logAuditEvent('member_invite', {
    resourceType: 'membro',
    resourceId: userId,
    metadata: { email: membro.email, papel: membro.papel, novo_link: true },
  });

  const texto = [
    `Segue um novo link para você entrar na equipe "${ctx.escritorio.workspace.nome}" no Sigiloteca, como ${PAPEL_LABELS[membro.papel as Papel]}.`,
    '',
    'Crie sua senha por este link (vale por tempo limitado e só pode ser usado uma vez):',
    link,
    '',
    'Se você não esperava este convite, ignore este e-mail.',
  ].join('\n');

  const envio = await enviarOuDevolverLink(membro.email, texto, link);
  return { error: null, ...envio };
}

export async function alterarPapel(
  userId: string,
  papelBruto: string
): Promise<ActionResult> {
  const ctx = await exigirAdmin();
  if (!ctx) return { error: SEM_PERMISSAO };
  if (!PAPEIS.includes(papelBruto as Papel)) {
    return { error: 'Papel inválido.' };
  }

  const { data: membro } = await ctx.supabase
    .from('workspace_membro')
    .select('email, papel')
    .eq('workspace_id', ctx.escritorio.workspace.id)
    .eq('user_id', userId)
    .maybeSingle();
  if (!membro) return { error: 'Membro não encontrado.' };
  if (membro.papel === papelBruto) return { error: null };

  const { error } = await ctx.supabase
    .from('workspace_membro')
    .update({ papel: papelBruto })
    .eq('workspace_id', ctx.escritorio.workspace.id)
    .eq('user_id', userId);
  if (error) return { error: mensagemDoBanco(error.message) };

  await logAuditEvent('member_role_change', {
    resourceType: 'membro',
    resourceId: userId,
    metadata: {
      email: membro.email,
      papel_anterior: membro.papel,
      papel: papelBruto,
    },
  });
  revalidatePath('/equipe');
  return { error: null };
}

// Tira a pessoa da equipe: o acesso aos documentos acaba na hora (as
// regras do banco checam a equipe a cada consulta). A conta dela continua
// existindo no Auth, só sem escritório.
export async function removerMembro(userId: string): Promise<ActionResult> {
  const ctx = await exigirAdmin();
  if (!ctx) return { error: SEM_PERMISSAO };
  // Sair da própria equipe por engano tranca a pessoa para fora; outro
  // administrador faz isso, se for o caso.
  if (userId === ctx.user.id) {
    return {
      error: 'Você não pode remover a si mesmo. Peça a outro administrador.',
    };
  }

  const { data: membro } = await ctx.supabase
    .from('workspace_membro')
    .select('email, papel')
    .eq('workspace_id', ctx.escritorio.workspace.id)
    .eq('user_id', userId)
    .maybeSingle();
  if (!membro) return { error: 'Membro não encontrado.' };

  const { error } = await ctx.supabase
    .from('workspace_membro')
    .delete()
    .eq('workspace_id', ctx.escritorio.workspace.id)
    .eq('user_id', userId);
  if (error) return { error: mensagemDoBanco(error.message) };

  await logAuditEvent('member_remove', {
    resourceType: 'membro',
    resourceId: userId,
    metadata: { email: membro.email, papel: membro.papel },
  });
  revalidatePath('/equipe');
  return { error: null };
}

export async function renomearEscritorio(nomeBruto: string): Promise<ActionResult> {
  const ctx = await exigirAdmin();
  if (!ctx) return { error: SEM_PERMISSAO };
  const nome = nomeBruto.trim();
  if (!nome) return { error: 'Informe o nome do escritório.' };
  if (nome.length > 120) return { error: 'Nome muito longo.' };

  const { error } = await ctx.supabase
    .from('workspace')
    .update({ nome })
    .eq('id', ctx.escritorio.workspace.id);
  if (error) return { error: mensagemDoBanco(error.message) };

  revalidatePath('/equipe');
  revalidatePath('/');
  return { error: null };
}
