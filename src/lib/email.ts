import { Resend } from "resend";

const FROM = "Raio Publicador <noreply@raiopublicador.com.br>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.raiopublicador.com.br";

// Logo embedada em base64 para garantir exibição em todos os clientes de email
const LOGO_BASE64 = "data:image/png;base64,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";

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
            <img src="${LOGO_BASE64}" alt="Raio Publicador" height="32" style="display:block;height:32px;width:auto;border:0">
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
export async function sendWelcomeEmail(to: string, firstName: string) {
  const html = base(`
    ${h1(`Bem-vindo(a) ao Raio, ${firstName}!`)}
    ${p("Estamos felizes em ter você por aqui. O Raio é a plataforma que conecta marcas às redações certas — de forma simples, rápida e profissional.")}
    ${p("Para começar, cadastre sua primeira marca e crie um release. Leva menos de cinco minutos.")}
    ${btn("Cadastrar minha marca", `${APP_URL}/boas-vindas`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: "Bem-vindo(a) ao Raio ⚡", html });
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
    ${p(`Olá, <strong>${firstName}</strong>! Seu release foi agendado e será distribuído na data e hora definidas.`)}
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
    ${h1("Seu release foi enviado! ⚡")}
    ${p(`Olá, <strong>${firstName}</strong>! Seu release foi distribuído com sucesso para as redações selecionadas.`)}
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
    ${h1("Seus créditos estão acabando")}
    ${p(`Olá, <strong>${firstName}</strong>! Você tem apenas <strong>${remaining} crédito${remaining !== 1 ? "s" : ""}</strong> disponíveis no momento.`)}
    ${p("Para continuar agendando releases sem interrupção, compre créditos avulsos ou faça upgrade do seu plano.")}
    ${btn("Ver opções de créditos", `${APP_URL}/configuracoes`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: "Seus créditos estão acabando — Raio", html });
}

// ─── 5. Créditos zerados ───────────────────────────────────────────────────────
export async function sendZeroCreditsEmail(to: string, firstName: string) {
  const html = base(`
    ${h1("Você ficou sem créditos")}
    ${p(`Olá, <strong>${firstName}</strong>! Seu saldo de créditos chegou a zero e não será possível agendar novos releases até que você recarregue.`)}
    ${p("Compre créditos avulsos para retomar agora, ou faça upgrade para um plano com mais créditos mensais.")}
    ${btn("Recarregar créditos", `${APP_URL}/configuracoes`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: "Você ficou sem créditos — Raio", html });
}

// ─── 6. Upgrade confirmado ─────────────────────────────────────────────────────
export async function sendUpgradeEmail(to: string, firstName: string, planLabel: string, credits: number) {
  const html = base(`
    ${h1("Upgrade realizado com sucesso ✓")}
    ${p(`Olá, <strong>${firstName}</strong>! Seu plano foi atualizado e os créditos já estão disponíveis na sua conta.`)}
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
    ${p(`Olá, <strong>${firstName}</strong>! Seu plano foi renovado com sucesso e seus créditos foram recarregados.`)}
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
    ${h1("Problema com seu pagamento")}
    ${p(`Olá, <strong>${firstName}</strong>! Não conseguimos processar a cobrança do seu plano <strong>${planLabel}</strong>.`)}
    ${p("Seu acesso pode ser suspenso em breve. Atualize sua forma de pagamento para evitar interrupções.")}
    ${btn("Atualizar forma de pagamento", `${APP_URL}/configuracoes`)}
    ${p('<span style="font-size:13px;color:#999">Se você acredita que isso é um engano, entre em contato com nosso suporte.</span>')}
  `);

  return getResend().emails.send({ from: FROM, to, subject: "Ação necessária: problema com seu pagamento — Raio", html });
}
