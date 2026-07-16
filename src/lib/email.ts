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
          <td style="background:#212121;padding:24px 32px">
            <img src="${LOGO_URL}" alt="Raio Publicador" height="48" style="display:block;height:48px;width:auto;border:0">
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 24px">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;background:#EEEEEE">
            <p style="margin:0;font-size:12px;color:#1a1a1a">
              Você está recebendo este e-mail porque possui uma conta no Raio Publicador.<br>
              <a href="${APP_URL}/configuracoes" style="color:#000000">Gerenciar notificações</a>
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
    ${h1(`${firstName}, você está no Raio! ⚡`)}
    ${p("Sua assinatura foi confirmada e você acaba de ganhar superpoderes de publicação. Seus créditos já estão disponíveis.")}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;background:#f9f9f7;border-radius:8px">
      <tr><td style="padding:10px 14px;color:#888;width:160px">Plano</td><td style="padding:10px 14px;color:#1a1a1a;font-weight:600">${planLabel}</td></tr>
      <tr style="border-top:1px solid #eee"><td style="padding:10px 14px;color:#888">Valor</td><td style="padding:10px 14px;color:#1a1a1a">${price}/mês</td></tr>
      <tr style="border-top:1px solid #eee"><td style="padding:10px 14px;color:#888">Créditos</td><td style="padding:10px 14px;color:#1a1a1a">${credits.toLocaleString("pt-BR")} créditos/mês</td></tr>
      <tr style="border-top:1px solid #eee"><td style="padding:10px 14px;color:#888">Próxima cobrança</td><td style="padding:10px 14px;color:#1a1a1a">${renewal}</td></tr>
    </table>
    ${p("Não deixe a energia acumular: cadastre sua primeira marca e crie um release. Leva menos de cinco minutos!")}
    ${btn("Cadastrar minha marca", `${APP_URL}/boas-vindas`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `${firstName}, você foi atingido pelo Raio ⚡ — Assinatura confirmada`, html });
}

// ─── 2. Release agendado ───────────────────────────────────────────────────────
export async function sendReleaseScheduledEmail(
  to: string,
  firstName: string,
  releaseTitle: string,
  scheduledAt: Date,
  vehicleNames: string[],
  releaseId: string,
) {
  const date = scheduledAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  const vehicleList = vehicleNames.length > 0
    ? vehicleNames.map(n => `<li style="padding:2px 0;color:#1a1a1a">${n}</li>`).join("")
    : `<li style="color:#888">—</li>`;

  const html = base(`
    ${h1(`Tudo certo, ${firstName}! ✓`)}
    ${p("O seu release já está agendado e será publicado nos portais selecionados.")}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px;vertical-align:top">Release</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${releaseTitle}</td></tr>
      <tr><td style="padding:8px 0;color:#888;vertical-align:top">Agendado para</td><td style="padding:8px 0;color:#1a1a1a">${date} (Brasília)</td></tr>
      <tr><td style="padding:8px 0;color:#888;vertical-align:top">Veículos</td><td style="padding:8px 0"><ul style="margin:0;padding:0 0 0 16px">${vehicleList}</ul></td></tr>
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
    ${h1(`Missão cumprida, ${firstName}! ⚡`)}
    ${p("Seu release saiu daqui como um raio e já está publicado.")}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Release</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${releaseTitle}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Veículos</td><td style="padding:8px 0;color:#1a1a1a">${vehicleCount} veículo${vehicleCount !== 1 ? "s" : ""}</td></tr>
    </table>
    ${p("Continue publicando conosco para acelerar ainda mais o crescimento da sua marca.")}
    ${btn("Ir para o painel", `${APP_URL}/releases/${releaseId}`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `Release enviado: ${releaseTitle}`, html });
}

// ─── 4. Créditos baixos ────────────────────────────────────────────────────────
export async function sendLowCreditsEmail(to: string, firstName: string, remaining: number) {
  const html = base(`
    ${h1(`${firstName}, seus créditos estão no limite! ⚠️`)}
    ${p(`Restam apenas <strong>${remaining} crédito${remaining !== 1 ? "s" : ""}</strong> na conta. Não deixe o ritmo de publicações da sua marca diminuir.`)}
    ${p("Adquira créditos avulsos ou faça upgrade do plano para continuar publicando sem pausas.")}
    ${btn("Ver opções de créditos", `${APP_URL}/configuracoes`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: "Créditos chegando ao fim — Raio", html });
}

// ─── 5. Créditos zerados ───────────────────────────────────────────────────────
export async function sendZeroCreditsEmail(to: string, firstName: string) {
  const html = base(`
    ${h1(`${firstName}, hora de recarregar as energias 😬`)}
    ${p("Os créditos acabaram e o Raio ficou sem energia para publicar novos releases.")}
    ${p("Adquira créditos avulsos para voltar agora mesmo, ou faça upgrade para nunca mais ficar no escuro.")}
    ${btn("Recarregar créditos", `${APP_URL}/configuracoes`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: "Saldo de créditos esgotado — Raio", html });
}

// ─── 6. Upgrade confirmado ─────────────────────────────────────────────────────
export async function sendUpgradeEmail(to: string, firstName: string, planLabel: string, credits: number) {
  const html = base(`
    ${h1(`${firstName}, o Raio ficou mais rápido! ⚡`)}
    ${p("Seu upgrade foi confirmado e agora sua marca tem potência para publicar novos releases.")}
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
    ${h1(`Mais um mês de raio, ${firstName}! ✓`)}
    ${p("Seu plano foi renovado e seus créditos foram recarregados. Tudo pronto para continuar publicando e ganhando relevância digital.")}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Plano</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${planLabel}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Créditos</td><td style="padding:8px 0;color:#1a1a1a">${credits.toLocaleString("pt-BR")} créditos disponíveis</td></tr>
      <tr><td style="padding:8px 0;color:#888">Próxima renovação</td><td style="padding:8px 0;color:#1a1a1a">${date}</td></tr>
    </table>
    ${btn("Criar um release", `${APP_URL}/releases/novo`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `Plano ${planLabel} renovado — Raio`, html });
}

// ─── 8. Aviso de renovação (7 dias antes) ─────────────────────────────────────
export async function sendRenewalReminderEmail(to: string, firstName: string, planLabel: string, amountBRL: string, renewalDate: Date) {
  const date = renewalDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });

  const html = base(`
    ${h1(`${firstName},`)}
    ${p(`Passando para avisar que o plano <strong>${planLabel}</strong> será renovado automaticamente no dia <strong>${date}</strong> no valor de <strong>R$ ${amountBRL}</strong>.`)}
    ${p("Caso não deseje continuar, você pode gerenciar ou pausar sua assinatura diretamente nas configurações antes dessa data. Após a cobrança, o reembolso é garantido por lei em até 7 dias (Art. 49, CDC).")}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Plano</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${planLabel}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Renovação em</td><td style="padding:8px 0;color:#1a1a1a">${date}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Valor</td><td style="padding:8px 0;color:#1a1a1a">R$ ${amountBRL}/mês</td></tr>
    </table>
    ${btn("Gerenciar assinatura", `${APP_URL}/configuracoes`)}
    ${p('<span style="font-size:12px;color:#999">Garantia de arrependimento: cancelamentos solicitados em até 7 dias após o pagamento têm direito a reembolso integral, conforme o Art. 49 do Código de Defesa do Consumidor, desde que nenhum crédito do período tenha sido utilizado.</span>')}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `Lembrete: plano ${planLabel} renova em 7 dias — Raio`, html });
}

// ─── 9. Falha no pagamento ─────────────────────────────────────────────────────
export async function sendPaymentFailedEmail(to: string, firstName: string, planLabel: string) {
  const html = base(`
    ${h1(`${firstName}, tivemos um problema ao processar seu pagamento 😕`)}
    ${p(`Não foi possível realizar a cobrança do plano <strong>${planLabel}</strong>. Isso pode acontecer com qualquer cartão — basta atualizar e pronto.`)}
    ${p("Atualize os seus dados de pagamento agora para não perder o acesso à plataforma e manter os agendamentos de seus releases em dia.")}
    ${btn("Atualizar forma de pagamento", `${APP_URL}/configuracoes`)}
    ${p('<span style="font-size:13px;color:#999">Se precisar de ajuda, fale com nosso suporte.</span>')}
  `);

  return getResend().emails.send({ from: FROM, to, subject: "Ação necessária: problema com o pagamento — Raio", html });
}

// ─── 10. Release enviado para publicação ──────────────────────────────────────
export async function sendReleaseSubmittedEmail(
  to: string,
  firstName: string,
  releaseTitle: string,
  releaseId: string,
) {
  const html = base(`
    ${h1(`${firstName}, seu release foi recebido com sucesso! Agora é com a gente. ✓`)}
    ${p("O release entrou na fila e nossa equipe vai cuidar da publicação a partir daqui.")}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Release</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${releaseTitle}</td></tr>
    </table>
    ${p("Enviaremos um e-mail quando o release for publicado.")}
    ${btn("Ver release", `${APP_URL}/releases/${releaseId}`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `Release enviado: ${releaseTitle}`, html });
}

// ─── 11. Release adicionado à fila (REMOVIDO — redundante) ───────────────────
/** @deprecated Não enviar — email removido da lista editorial */
export async function sendReleaseQueuedEmail(
  to: string,
  firstName: string,
  releaseTitle: string,
  position: number,
  releaseId: string,
) {
  void to; void firstName; void releaseTitle; void position; void releaseId;
  return Promise.resolve();
}

// ─── 12. Publicado em veículo ─────────────────────────────────────────────────
export async function sendReleasePublishedInVehicleEmail(
  to: string,
  firstName: string,
  releaseTitle: string,
  vehicleName: string,
  vehicleUrl: string | null,
  releaseId: string,
) {
  const html = base(`
    ${h1(`Boas notícias, ${firstName}! ⚡`)}
    ${p("Sua matéria acaba de ser publicada no nosso portal parceiro. A notícia está se espalhando.")}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Release</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${releaseTitle}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Veículo</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${vehicleName}</td></tr>
    </table>
    ${vehicleUrl ? btn("Ver publicação", vehicleUrl) : ""}
    ${btn("Ver release", `${APP_URL}/releases/${releaseId}`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `Publicado em ${vehicleName}: ${releaseTitle}`, html });
}

// ─── 13. Release precisa de revisão ───────────────────────────────────────────
export async function sendReleaseNeedsReviewEmail(
  to: string,
  firstName: string,
  releaseTitle: string,
  reason: string,
  releaseId: string,
) {
  const html = base(`
    ${h1(`${firstName}, quase tudo pronto, só falta um ajuste 🔧`)}
    ${p("Nossa equipe de revisão editorial solicitou uma correção para que sua matéria seja aceita para publicação.")}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Release</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${releaseTitle}</td></tr>
      <tr><td style="padding:8px 0;color:#888;vertical-align:top">Motivo</td><td style="padding:8px 0;color:#1a1a1a">${reason}</td></tr>
    </table>
    ${p("Acesse o release, faça os ajustes indicados e reenvie para que possamos publicar sua matéria o quanto antes.")}
    ${btn("Revisar release", `${APP_URL}/releases/${releaseId}`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `Revisão necessária: ${releaseTitle}`, html });
}

// ─── 14. Release reprovado ─────────────────────────────────────────────────────
export async function sendReleaseRejectedEmail(
  to: string,
  firstName: string,
  releaseTitle: string,
  reason: string,
  releaseId: string,
) {
  const html = base(`
    ${h1(`${firstName}, seu release não atende os critérios editoriais desta vez.`)}
    ${p("Durante a análise de conformidade, identificamos que o conteúdo infringe as nossas diretrizes ou regras dos portais parceiros. Veja o motivo abaixo e reenvie quando estiver pronto.")}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Release</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${releaseTitle}</td></tr>
      ${reason ? `<tr><td style="padding:8px 0;color:#888;vertical-align:top">Motivo</td><td style="padding:8px 0;color:#1a1a1a">${reason}</td></tr>` : ""}
    </table>
    ${p("Seus créditos foram devolvidos ao seu saldo. Caso tenha dúvidas, entre em contato com nosso suporte.")}
    ${btn("Ver release", `${APP_URL}/releases/${releaseId}`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `Release não aprovado: ${releaseTitle}`, html });
}

// ─── 15. Release em publicação (REMOVIDO — redundante) ────────────────────────
/** @deprecated Não enviar — email removido da lista editorial */
export async function sendReleaseInPublicationEmail(
  to: string,
  firstName: string,
  releaseTitle: string,
  releaseId: string,
) {
  void to; void firstName; void releaseTitle; void releaseId;
  return Promise.resolve();
}

// ─── 16. Release publicado com links por veículo (REMOVIDO — redundante) ───────
/** @deprecated Não enviar — email removido da lista editorial */
export async function sendReleasePublishedWithLinksEmail(
  to: string,
  firstName: string,
  releaseTitle: string,
  vehicleUrls: Record<string, string>,
  releaseId: string,
) {
  void to; void firstName; void releaseTitle; void vehicleUrls; void releaseId;
  return Promise.resolve();
}

// ─── 17. Notificação admin (REMOVIDO — redundante) ────────────────────────────
/** @deprecated Não enviar — email removido da lista editorial */
export async function sendAdminNewReleaseEmail(
  releaseTitle: string,
  userName: string,
  userEmail: string,
  vehicleCount: number,
  scheduledAt: Date | null,
) {
  void releaseTitle; void userName; void userEmail; void vehicleCount; void scheduledAt;
  return Promise.resolve();
}

// ─── 18. Convite de colaboração ────────────────────────────────────────────────
export async function sendInviteEmail(
  to: string,
  ownerName: string,
  roleLabel: string,
  inviteUrl: string,
) {
  const html = base(`
    ${h1(`Você tem um convite de equipe esperando por você! 🎉`)}
    ${p(`<strong>${ownerName}</strong> te convidou para colaborar no <strong>Raio Publicador</strong> com a função de <strong>${roleLabel}</strong>.`)}
    ${btn("Aceitar convite →", inviteUrl)}
    ${p('<span style="font-size:12px;color:#999">Este convite expira em 7 dias. Se você não esperava receber este e-mail, pode ignorá-lo.</span>')}
  `);

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${ownerName} te convidou para o Raio Publicador`,
    html,
  });
}

// ─── 19. Convite aceito por editor/revisor ─────────────────────────────────────
export async function sendInviteAcceptedEmail(
  to: string,
  firstName: string,
  inviteeName: string,
  inviteeEmail: string,
  role: string,
) {
  const roleLabel = role === "editor" ? "Editor" : role === "revisor" ? "Revisor" : role;
  const html = base(`
    ${h1(`A sua equipe cresceu, ${firstName}! ✓`)}
    ${p("Excelente notícia: o seu convite foi aceito e o novo integrante já está ativo na plataforma.")}
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:8px 0;color:#888;width:130px">Nome</td><td style="padding:8px 0;color:#1a1a1a;font-weight:600">${inviteeName}</td></tr>
      <tr><td style="padding:8px 0;color:#888">E-mail</td><td style="padding:8px 0;color:#1a1a1a">${inviteeEmail}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Função</td><td style="padding:8px 0;color:#1a1a1a">${roleLabel}</td></tr>
    </table>
    ${btn("Gerenciar equipe", `${APP_URL}/configuracoes`)}
  `);

  return getResend().emails.send({ from: FROM, to, subject: `${inviteeName} aceitou o convite — Raio`, html });
}

// ─── 20. Cancelamento ──────────────────────────────────────────────────────────
export async function sendCancellationEmail(
  to: string,
  firstName: string,
  refunded: boolean,
  periodEnd: Date | null,
  planLabel: string,
) {
  if (refunded) {
    const html = base(`
      ${h1("Assinatura cancelada e estorno solicitado.")}
      ${p(`Olá, ${firstName}.`)}
      ${p(`Confirmamos que a sua assinatura do plano <strong>${planLabel}</strong> foi cancelada com sucesso dentro do prazo legal de arrependimento de 7 dias (Art. 49 do CDC).`)}
      ${p("O estorno do valor integral foi solicitado à sua operadora de cartão de crédito e constará em sua fatura em até 10 dias úteis. Seus rascunhos, marcas e releases foram removidos da plataforma de forma segura.")}
      ${p("Se mudar de ideia, você pode assinar novamente a qualquer momento.")}
      ${btn("Voltar ao Raio", APP_URL)}
    `);
    return getResend().emails.send({ from: FROM, to, subject: "Assinatura cancelada e reembolso processado — Raio", html });
  } else {
    const until = periodEnd
      ? periodEnd.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
      : "o fim do ciclo atual";
    const html = base(`
      ${h1("Confirmação de encerramento de assinatura.")}
      ${p(`Olá, ${firstName}.`)}
      ${p(`Sua assinatura do plano <strong>${planLabel}</strong> foi cancelada e não será renovada no próximo mês. Para que você aproveite o valor pago, seu acesso e seus créditos remanescentes permanecem 100% ativos até o dia <strong>${until}</strong>.`)}
      ${p("Lembre-se de agendar seus releases até essa data, pois os créditos não utilizados após o vencimento expiram e não são reembolsados.")}
      ${p("Se mudar de ideia, você pode reativar sua assinatura a qualquer momento.")}
      ${btn("Gerenciar assinatura", `${APP_URL}/configuracoes`)}
    `);
    return getResend().emails.send({ from: FROM, to, subject: "Assinatura cancelada — Raio", html });
  }
}
