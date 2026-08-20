export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { Resend } from "resend";

// Clerk assina os webhooks com SVIX — verificamos a assinatura para evitar spoofing
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET ?? "";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest) {
  // Verificação de assinatura SVIX
  const svixId        = req.headers.get("svix-id") ?? "";
  const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
  const svixSignature = req.headers.get("svix-signature") ?? "";

  if (!WEBHOOK_SECRET) {
    console.error("[clerk-webhook] CLERK_WEBHOOK_SECRET não configurado — verifique as env vars no Vercel");
    // Sem secret, tenta processar sem verificação de assinatura (somente em dev)
    // Em produção, rejeita para segurança
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
  }

  const body = await req.text();

  let payload: Record<string, unknown>;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    payload = wh.verify(body, {
      "svix-id":        svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as Record<string, unknown>;
    console.log("[clerk-webhook] assinatura verificada ✓");
  } catch (err) {
    console.error("[clerk-webhook] assinatura inválida:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventType = payload.type as string;

  // Apenas processamos emails.created — outros eventos são ignorados
  if (eventType !== "email.created") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = payload.data as any;
  const toEmail  = data?.to_email_address as string | undefined;
  const subject  = data?.subject         as string | undefined;
  const htmlBody = data?.body            as string | undefined;

  if (!toEmail || !subject || !htmlBody) {
    console.error("[clerk-webhook] email.created payload incompleto:", JSON.stringify(data));
    return NextResponse.json({ error: "Incomplete payload" }, { status: 400 });
  }

  console.log(`[clerk-webhook] enviando email para ${toEmail} | assunto: ${subject}`);
  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: "Raio Publicador <noreply@raiopublicador.com.br>",
      to:   toEmail,
      subject,
      html: htmlBody,
    });
    console.log("[clerk-webhook] ✓ email enviado via Resend — id:", (result as { data?: { id?: string } })?.data?.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[clerk-webhook] ✗ erro ao enviar email via Resend:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
