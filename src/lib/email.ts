import { Resend } from "resend";

const FROM = "Raio Publicador <noreply@raiopublicador.com.br>";
const APP_URL = "https://raiopublicador.com.br";
const LOGO_URL = `${APP_URL}/assets/logo/raio-logo-email.png`;

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function base(content: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%">
        <tr>
          <td style="background:#ffffff;padding:24px 32px;border-bottom:1px solid #f0f0f0">
            <img src="${LOGO_URL}" alt="Raio Publicador" height="48" style="display:block;height:48px;width:auto;border:0">
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 24px">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px">
            <p style="margin:24px 0 0;font-size:12px;color:#999;border-top:1px solid #eee;padding-top:20px">
              Você está recebendo este e-mail porque possui uma conta no Raio Publicador.<br>
              <a href="${APP_URL}/configuracoes" style="color:#999">Gerenciar notificações</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(label: string, url: string) {
  return `<a href="${url}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#1a1a1a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">${label}</a>`;
}

function h1(text: string) {
  return `<h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a1a;line-height:1.3">${text}</h1>`;
}

function p(text: string) {
  return `<p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6">${text}</p>`;
}

// ─── 1. Boas-vindas ────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(
  to: string,
  firstName: string,
  planLabel: string,
  priceCents: number,
  credits: number,
  nextRenewal: Date,
) {
  const price = (priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const renewal = nextRenewal.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });

  const html = base(`
    ${h1(`Bem-vinde ao Raio, ${firstName}!`)}
    ${p("Sua assinatura foi confirmada e seus créditos já estão disponíveis. Agora é só publicar.")}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;background:#f9f9f7;border-radius:8px">
      <tr><td style="padding:10px 14px;color:#888;width:160px">Plano</td><td style="padding:10px 14px;color:#1a1a1a;font-weight:600">${planLabel}</td></tr>
      <tr style="border-top:1px solid #eee"><td style="padding:10px 14px;color:#888">Valor</td><td style="padding:10px 14px;color:#1a1a1a">${price}/mês</td></tr>
      <tr style="border-top:1px solid #eee"><td style="padding:10px 14px;color:#888">Créditos</td><td style="padding:10px 14px;color:#1a1a1a">${credits.toLocaleString("pt-BR")} créditos/mês</td></tr>
      <tr style="border-top:1px solid #eee"><td style="padding:10px 14px;color:#888">Próxima cobrança</td><td style="padding:10px 14px;color:#1a1a1a">${renewal}</td></tr>
    </table>
    ${p("Para começar, cadastre sua primeira marca e crie um release. Leva menos de cinco minutos.")}
    ${btn("Cadastrar minha marca", `${APP_URL}/boas-vindas`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: "Bem-vinde ao Raio ⚡ — Assinatura confirmada", html });
}

// ─── 2. Release agendado ───────────────────────────────────────────────────────
export async function sendReleaseScheduledEmail(
  to: string,
  firstName: string,
  releaseTitle: string,
  scheduledAt: Date,
  vehicleCount: number,
  releaseId: string,
) {
  const date = scheduledAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

  const html = base(`
    ${h1("Release agendado com sucesso ✓")}
    ${p(`Olá, <strong>${firstName}</strong>! O release foi agendado e será distribuído na data e hora definidas.`)}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px;vertical-align:top">Release</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${releaseTitle}</td></tr>
      <tr><td style="padding:8px 0;color:#888;vertical-align:top">Agendado para</td><td style="padding:8px 0;color:#1a1a1a">${date} (Brasília)</td></tr>
      <tr><td style="padding:8px 0;color:#888;vertical-align:top">Veículos</td><td style="padding:8px 0;color:#1a1a1a">${vehicleCount} veículo${vehicleCount !== 1 ? "s" : ""} selecionado${vehicleCount !== 1 ? "s" : ""}</td></tr>
    </table>
    ${btn("Ver release", `${APP_URL}/releases/${releaseId}`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `Release agendado: ${releaseTitle}`, html });
}

// ─── 3. Release publicado ──────────────────────────────────────────────────────
export async function sendReleasePublishedEmail(
  to: string,
  firstName: string,
  releaseTitle: string,
  vehicleCount: number,
  releaseId: string,
) {
  const html = base(`
    ${h1("Release distribuído com sucesso! ⚡")}
    ${p(`Olá, <strong>${firstName}</strong>! O release foi distribuído para as redações selecionadas.`)}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Release</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${releaseTitle}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Veículos</td><td style="padding:8px 0;color:#1a1a1a">${vehicleCount} veículo${vehicleCount !== 1 ? "s" : ""}</td></tr>
    </table>
    ${p("Acompanhe o status da distribuição pelo painel.")}
    ${btn("Ir para o painel", `${APP_URL}/releases/${releaseId}`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `Release enviado: ${releaseTitle}`, html });
}

// ─── 4. Créditos baixos ────────────────────────────────────────────────────────
export async function sendLowCreditsEmail(to: string, firstName: string, remaining: number) {
  const html = base(`
    ${h1("Créditos chegando ao fim")}
    ${p(`Olá, <strong>${firstName}</strong>! A conta tem apenas <strong>${remaining} crédito${remaining !== 1 ? "s" : ""}</strong> disponíveis no momento.`)}
    ${p("Para continuar agendando releases sem interrupção, adquira créditos avulsos ou faça upgrade do plano.")}
    ${btn("Ver opções de créditos", `${APP_URL}/configuracoes`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: "Créditos chegando ao fim — Raio", html });
}

// ─── 5. Créditos zerados ───────────────────────────────────────────────────────
export async function sendZeroCreditsEmail(to: string, firstName: string) {
  const html = base(`
    ${h1("Saldo de créditos esgotado")}
    ${p(`Olá, <strong>${firstName}</strong>! O saldo de créditos chegou a zero. Não será possível agendar novos releases até recarregar.`)}
    ${p("Adquira créditos avulsos para retomar agora, ou faça upgrade para um plano com mais créditos mensais.")}
    ${btn("Recarregar créditos", `${APP_URL}/configuracoes`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: "Saldo de créditos esgotado — Raio", html });
}

// ─── 6. Upgrade confirmado ─────────────────────────────────────────────────────
export async function sendUpgradeEmail(to: string, firstName: string, planLabel: string, credits: number) {
  const html = base(`
    ${h1("Upgrade confirmado ✓")}
    ${p(`Olá, <strong>${firstName}</strong>! O plano foi atualizado e os créditos já estão disponíveis na conta.`)}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Novo plano</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${planLabel}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Créditos</td><td style="padding:8px 0;color:#1a1a1a">${credits.toLocaleString("pt-BR")} créditos/mês</td></tr>
    </table>
    ${btn("Criar um release", `${APP_URL}/releases/novo`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `Plano ${planLabel} ativado — Raio`, html });
}

// ─── 7. Renovação do plano ─────────────────────────────────────────────────────
export async function sendRenewalEmail(to: string, firstName: string, planLabel: string, credits: number, nextRenewal: Date) {
  const date = nextRenewal.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });

  const html = base(`
    ${h1("Plano renovado ✓")}
    ${p(`Olá, <strong>${firstName}</strong>! O plano foi renovado com sucesso e os créditos foram recarregados.`)}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Plano</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${planLabel}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Créditos</td><td style="padding:8px 0;color:#1a1a1a">${credits.toLocaleString("pt-BR")} créditos disponíveis</td></tr>
      <tr><td style="padding:8px 0;color:#888">Próxima renovação</td><td style="padding:8px 0;color:#1a1a1a">${date}</td></tr>
    </table>
    ${btn("Criar um release", `${APP_URL}/releases/novo`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `Plano ${planLabel} renovado — Raio`, html });
}

// ─── 8. Falha no pagamento ─────────────────────────────────────────────────────
export async function sendPaymentFailedEmail(to: string, firstName: string, planLabel: string) {
  const html = base(`
    ${h1("Problema com o pagamento")}
    ${p(`Olá, <strong>${firstName}</strong>! Não foi possível processar a cobrança do plano <strong>${planLabel}</strong>.`)}
    ${p("O acesso pode ser suspenso em breve. Atualize a forma de pagamento para evitar interrupções.")}
    ${btn("Atualizar forma de pagamento", `${APP_URL}/configuracoes`)}
    ${p('<span style="font-size:13px;color:#999">Se acreditar que isso é um engano, entre em contato com nosso suporte.</span>')}
  `);

  return getResend().emails.send({ from: FROM, to, subject: "Ação necessária: problema com o pagamento — Raio", html });
}

// ─── 9. Release enviado para publicação ───────────────────────────────────────
export async function sendReleaseSubmittedEmail(
  to: string,
  firstName: string,
  releaseTitle: string,
  releaseId: string,
) {
  const html = base(`
    ${h1("Release enviado para publicação ✓")}
    ${p(`Olá, <strong>${firstName}</strong>! O release foi enviado e está sendo processado para distribuição.`)}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Release</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${releaseTitle}</td></tr>
    </table>
    ${p("Uma notificação será enviada assim que a distribuição for concluída.")}
    ${btn("Ver release", `${APP_URL}/releases/${releaseId}`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `Release enviado: ${releaseTitle}`, html });
}

// ─── 10. Release adicionado à fila ────────────────────────────────────────────
export async function sendReleaseQueuedEmail(
  to: string,
  firstName: string,
  releaseTitle: string,
  position: number,
  releaseId: string,
) {
  const html = base(`
    ${h1("Release adicionado à fila ✓")}
    ${p(`Olá, <strong>${firstName}</strong>! O release foi adicionado à fila de distribuição.`)}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Release</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${releaseTitle}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Posição na fila</td><td style="padding:8px 0;color:#1a1a1a">${position}º</td></tr>
    </table>
    ${p("Acompanhe o andamento pelo painel.")}
    ${btn("Ver release", `${APP_URL}/releases/${releaseId}`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `Release na fila: ${releaseTitle}`, html });
}

// ─── 11. Release publicado no veículo ─────────────────────────────────────────
export async function sendReleasePublishedInVehicleEmail(
  to: string,
  firstName: string,
  releaseTitle: string,
  vehicleName: string,
  vehicleUrl: string | null,
  releaseId: string,
) {
  const html = base(`
    ${h1("Release publicado em um veículo ⚡")}
    ${p(`Olá, <strong>${firstName}</strong>! O release foi publicado em mais um veículo.`)}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Release</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${releaseTitle}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Veículo</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${vehicleName}</td></tr>
    </table>
    ${vehicleUrl ? btn("Ver publicação", vehicleUrl) : ""}
    ${btn("Ver release", `${APP_URL}/releases/${releaseId}`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `Publicado em ${vehicleName}: ${releaseTitle}`, html });
}

// ─── 12. Release precisa de revisão ───────────────────────────────────────────
export async function sendReleaseNeedsReviewEmail(
  to: string,
  firstName: string,
  releaseTitle: string,
  reason: string,
  releaseId: string,
) {
  const html = base(`
    ${h1("Release precisa de revisão")}
    ${p(`Olá, <strong>${firstName}</strong>! O release foi analisado e precisa de ajustes antes de ser distribuído.`)}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Release</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${releaseTitle}</td></tr>
      <tr><td style="padding:8px 0;color:#888;vertical-align:top">Motivo</td><td style="padding:8px 0;color:#1a1a1a">${reason}</td></tr>
    </table>
    ${p("Acesse o release, faça os ajustes necessários e reenvie para publicação.")}
    ${btn("Revisar release", `${APP_URL}/releases/${releaseId}`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `Revisão necessária: ${releaseTitle}`, html });
}

// ─── 13. Release reprovado ─────────────────────────────────────────────────────
export async function sendReleaseRejectedEmail(
  to: string,
  firstName: string,
  releaseTitle: string,
  reason: string,
  releaseId: string,
) {
  const html = base(`
    ${h1("Release não aprovado")}
    ${p(`Olá, <strong>${firstName}</strong>! O release não foi aprovado para distribuição.`)}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Release</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${releaseTitle}</td></tr>
      ${reason ? `<tr><td style="padding:8px 0;color:#888;vertical-align:top">Motivo</td><td style="padding:8px 0;color:#1a1a1a">${reason}</td></tr>` : ""}
    </table>
    ${p("Em caso de dúvidas, entre em contato com nosso suporte.")}
    ${btn("Ver release", `${APP_URL}/releases/${releaseId}`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `Release não aprovado: ${releaseTitle}`, html });
}

// ─── 14. Release em publicação (bloqueado para edição) ─────────────────────────
export async function sendReleaseInPublicationEmail(
  to: string,
  firstName: string,
  releaseTitle: string,
  releaseId: string,
) {
  const html = base(`
    ${h1("Release em publicação ⚡")}
    ${p(`Olá, <strong>${firstName}</strong>! O release foi aprovado e está sendo distribuído para as redações agora.`)}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Release</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${releaseTitle}</td></tr>
    </table>
    ${p("Os links das publicações serão enviados assim que a distribuição for concluída.")}
    ${btn("Ver release", `${APP_URL}/releases/${releaseId}`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `Em publicação: ${releaseTitle}`, html });
}

// ─── 15. Release publicado com links por veículo ───────────────────────────────
export async function sendReleasePublishedWithLinksEmail(
  to: string,
  firstName: string,
  releaseTitle: string,
  vehicleUrls: Record<string, string>,
  releaseId: string,
) {
  const vehicleCount = Object.keys(vehicleUrls).length;
  const urlRows = Object.entries(vehicleUrls)
    .map(([name, url]) => `<tr><td style="padding:6px 0;color:#888;width:130px">${name}</td><td style="padding:6px 0"><a href="${url}" style="color:#1a1a1a;font-weight:600">${url}</a></td></tr>`)
    .join("");

  const html = base(`
    ${h1("Release publicado com sucesso! ⚡")}
    ${p(`Olá, <strong>${firstName}</strong>! O release foi distribuído em ${vehicleCount} veículo${vehicleCount !== 1 ? "s" : ""}.`)}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Release</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${releaseTitle}</td></tr>
    </table>
    ${vehicleCount > 0 ? `
    <p style="margin:16px 0 8px;font-size:14px;font-weight:600;color:#1a1a1a">Links das publicações:</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin:0 0 16px">${urlRows}</table>
    ` : ""}
    ${btn("Ver release", `${APP_URL}/releases/${releaseId}`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `Publicado com sucesso: ${releaseTitle}`, html });
}

// ─── 16. Notificação admin — novo release agendado ─────────────────────────────
export async function sendAdminNewReleaseEmail(
  releaseTitle: string,
  userName: string,
  userEmail: string,
  vehicleCount: number,
  scheduledAt: Date | null,
) {
  const adminEmail = process.env.ADMIN_EMAIL ?? "raiopublicador@gmail.com";
  const date = scheduledAt
    ? scheduledAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })
    : "Não definida";

  const html = base(`
    ${h1("Novo release para análise")}
    ${p("Um novo release foi agendado e está aguardando análise no painel admin.")}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Release</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${releaseTitle}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Pessoa</td><td style="padding:8px 0;color:#1a1a1a">${userName} (${userEmail})</td></tr>
      <tr><td style="padding:8px 0;color:#888">Agendado para</td><td style="padding:8px 0;color:#1a1a1a">${date}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Veículos</td><td style="padding:8px 0;color:#1a1a1a">${vehicleCount} veículo${vehicleCount !== 1 ? "s" : ""}</td></tr>
    </table>
    ${btn("Analisar no painel", `${APP_URL}/admin/releases`)}
  `);

  return getResend().emails.send({ from: FROM, to: adminEmail, subject: `[Admin] Novo release: ${releaseTitle}`, html });
}

// ─── 17. Convite aceito por editor/revisor ─────────────────────────────────────
export async function sendInviteAcceptedEmail(
  to: string,
  firstName: string,
  inviteeName: string,
  inviteeEmail: string,
  role: string,
) {
  const roleLabel = role === "editor" ? "Editor" : role === "revisor" ? "Revisor" : role;
  const html = base(`
    ${h1("Convite aceito ✓")}
    ${p(`Olá, <strong>${firstName}</strong>! Um colaborador aceitou o convite e já faz parte da equipe no Raio.`)}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Nome</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${inviteeName}</td></tr>
      <tr><td style="padding:8px 0;color:#888">E-mail</td><td style="padding:8px 0;color:#1a1a1a">${inviteeEmail}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Função</td><td style="padding:8px 0;color:#1a1a1a">${roleLabel}</td></tr>
    </table>
    ${btn("Gerenciar equipe", `${APP_URL}/configuracoes`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `${inviteeName} aceitou o convite — Raio`, html });
}
