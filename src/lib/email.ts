import { Resend } from "resend";

const FROM = "Raio Publicador <noreply@raiopublicador.com.br>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.raiopublicador.com.br";

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
          <td style="background:#1a1a1a;padding:20px 32px">
            <img src="${APP_URL}/assets/logo/raio-logo-email.png" alt="Raio Publicador" height="36" style="display:block;height:36px;width:auto;border:0">
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
