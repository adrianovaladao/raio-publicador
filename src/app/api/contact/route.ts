export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { name, email, company, phone, volume, msg } = await req.json() as {
    name: string; email: string; company: string; phone: string; volume: string; msg?: string;
  };

  if (!name || !email || !company) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  await resend.emails.send({
    from: "Raio Publicador <noreply@raiopublicador.com.br>",
    to: "adrianovaladao@raiopublicador.com.br",
    replyTo: email,
    subject: `📩 Novo contato comercial — ${company}`,
    html: `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;background:#f4f4f0;padding:32px 16px">
        <div style="background:#000;padding:24px 32px;border-radius:12px 12px 0 0">
          <img src="https://raiopublicador.com.br/assets/logo/raio-logo-email.png" alt="Raio Publicador" height="34" style="height:34px;width:auto;display:block">
        </div>
        <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px">
          <h2 style="margin:0 0 24px;font-size:20px;color:#0a0a0a">Novo contato comercial</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333">
            <tr><td style="padding:8px 0;color:#888;width:140px">Nome</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#888">E-mail</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#c97b00">${email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#888">Empresa</td><td style="padding:8px 0;font-weight:600">${company}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Telefone</td><td style="padding:8px 0">${phone || "—"}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Volume estimado</td><td style="padding:8px 0">${volume}</td></tr>
            ${msg ? `<tr><td style="padding:8px 0;color:#888;vertical-align:top">Mensagem</td><td style="padding:8px 0">${msg}</td></tr>` : ""}
          </table>
          <div style="margin-top:28px">
            <a href="mailto:${email}" style="display:inline-block;padding:12px 24px;background:#FBBF24;color:#000;font-weight:700;text-decoration:none;border-radius:8px;font-size:14px">Responder para ${name}</a>
          </div>
        </div>
        <p style="text-align:center;font-size:11px;color:#999;margin-top:16px">Raio Publicador · raiopublicador.com.br</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
