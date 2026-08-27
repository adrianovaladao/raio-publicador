/**
 * E-mails transacionais relacionados a pagamento via Pix.
 * Usado pelo cron de renovação Pix (DORMANT — ativar com PIX_RENEWAL_ENABLED=true).
 */
import { Resend } from "resend";

function getResend() { return new Resend(process.env.RESEND_API_KEY); }

function fmtBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
}

/**
 * E-mail de renovação via Pix enviado 7, 2 e 0 dias antes do vencimento.
 * Inclui copia-e-cola do Pix para facilitar o pagamento.
 */
export async function sendPixRenewalEmail(
  email: string,
  firstName: string,
  planLabel: string,
  amountCents: number,
  renewalDate: Date,
  pixCopiaECola: string,
  daysLeft: number,
) {
  const amountBRL = fmtBRL(amountCents);
  const renewalFmt = fmtDate(renewalDate);

  const subjectMap: Record<number, string> = {
    7: `Sua assinatura ${planLabel} renova em 7 dias — Raio`,
    2: `Sua assinatura ${planLabel} renova em 2 dias — Raio`,
    0: `Sua assinatura ${planLabel} renova hoje — Raio`,
  };

  const introMap: Record<number, string> = {
    7: `Sua assinatura do Plano <strong>${planLabel}</strong> vence em <strong>7 dias</strong> (${renewalFmt}).`,
    2: `Sua assinatura do Plano <strong>${planLabel}</strong> vence em <strong>2 dias</strong> (${renewalFmt}).`,
    0: `Sua assinatura do Plano <strong>${planLabel}</strong> vence <strong>hoje</strong> (${renewalFmt}).`,
  };

  const subject = subjectMap[daysLeft] ?? `Renovação via Pix — Raio`;
  const intro   = introMap[daysLeft] ?? `Sua assinatura do Plano <strong>${planLabel}</strong> vence em ${renewalFmt}.`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr><td style="background:#1a1a1a;padding:24px 32px">
          <span style="font-size:22px;font-weight:900;color:#FFCC00;letter-spacing:-0.5px">⚡ Raio</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px">
          <p style="margin:0 0 16px;font-size:16px;color:#333">Olá, ${firstName}!</p>
          <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6">${intro}<br>Para continuar com acesso ao Raio, realize o pagamento via Pix no valor de <strong>R$ ${amountBRL}</strong>.</p>

          <!-- Pix box -->
          <div style="background:#f8f8f8;border:1.5px solid #e0e0e0;border-radius:12px;padding:20px 24px;margin-bottom:24px">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.08em">Pix Copia e Cola</p>
            <div style="background:#ffffff;border:1px solid #ddd;border-radius:8px;padding:12px;font-family:monospace;font-size:11px;color:#333;word-break:break-all;line-height:1.5">${pixCopiaECola}</div>
            <p style="margin:10px 0 0;font-size:12px;color:#888">Copie o código acima e cole no app do seu banco em <em>Pix → Copia e Cola</em>.</p>
          </div>

          <p style="margin:0 0 8px;font-size:13px;color:#666;line-height:1.6">
            ⚠️ <strong>Atenção:</strong> o código expira em 72 horas. Após o prazo, entre em contato com o suporte para gerar um novo QR Code.
          </p>
          <p style="margin:0;font-size:13px;color:#666;line-height:1.6">
            Se já realizou o pagamento, aguarde a confirmação em até 1 hora útil.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8f8f8;padding:20px 32px;border-top:1px solid #eee">
          <p style="margin:0;font-size:12px;color:#aaa;text-align:center">Raio Publicador &bull; raiopublicador.com.br</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await getResend().emails.send({
    from: "Raio Publicador <avisos@raiopublicador.com.br>",
    to: email,
    subject,
    html,
  });
}
