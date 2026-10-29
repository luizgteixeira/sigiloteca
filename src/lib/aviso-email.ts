import nodemailer from 'nodemailer';

// Envio de e-mails do próprio app (não os de autenticação, que saem pelo
// SMTP configurado no painel do Supabase). Usa a mesma caixa da Hostinger.
// Sem as variáveis SMTP_* / AVISO_TITULARES_PARA configuradas, não envia
// nada — o aviso é um extra, nunca pode impedir a ação principal.
function configurado(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.AVISO_TITULARES_PARA
  );
}

// Envio genérico (texto simples). false = SMTP não configurado, nada saiu;
// erro de envio propaga para quem chamou decidir o que fazer.
export async function enviarEmail(mensagem: {
  para: string;
  assunto: string;
  texto: string;
}): Promise<boolean> {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    return false;
  }
  const porta = Number(process.env.SMTP_PORT || 465);
  const transporte = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: porta,
    secure: porta === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporte.sendMail({
    from: `Sigiloteca <${process.env.SMTP_USER}>`,
    to: mensagem.para,
    subject: mensagem.assunto,
    text: mensagem.texto,
  });
  return true;
}

export async function avisarNovaSolicitacaoTitular(dados: {
  direito: string;
  recebidaEm: string;
  linkPainel: string;
}): Promise<void> {
  if (!configurado()) {
    console.warn('Aviso de solicitação de titular não enviado: SMTP não configurado.');
    return;
  }

  const porta = Number(process.env.SMTP_PORT || 465);
  const transporte = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: porta,
    secure: porta === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  // O e-mail não leva nome, e-mail, CPF nem a descrição do titular — só o
  // tipo de pedido e o link. Os dados pessoais ficam no Sigiloteca, atrás
  // de login, em vez de se espalharem por caixas de e-mail.
  const texto = [
    'Chegou uma nova solicitação de titular de dados (LGPD, art. 18) no Sigiloteca.',
    '',
    `Direito solicitado: ${dados.direito}`,
    `Recebida em: ${dados.recebidaEm}`,
    '',
    `Veja os detalhes e responda pelo painel: ${dados.linkPainel}`,
    '',
    'Atenção aos prazos: a declaração completa de acesso deve ser enviada em até 15 dias (art. 19, II).',
  ].join('\n');

  await transporte.sendMail({
    from: `Sigiloteca <${process.env.SMTP_USER}>`,
    to: process.env.AVISO_TITULARES_PARA,
    subject: 'Nova solicitação de titular – Sigiloteca',
    text: texto,
  });
}
