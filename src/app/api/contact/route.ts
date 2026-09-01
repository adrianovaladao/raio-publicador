export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { name, email, company, phone, volume, msg } = await req.json() as {
      name: string;
      email: string;
      company: string;
      phone?: string;
      volume?: string;
      msg?: string;
    };

    if (!name?.trim() || !email?.trim() || !company?.trim()) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    await resend.emails.send({
      from: "Raio Publicador <contato@raiopublicador.com.br>",
      to: "contato@raiopublicador.com.br",
      replyTo: email,
      subject: `[Time Comercial] Novo lead: ${company}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; color: #1a1a1a;">
          <h2 style="margin-bottom: 4px;">Novo lead — Time Comercial</h2>
          <p style="color: #888; font-size: 13px; margin-top: 0;">Mensagem recebida pelo formulário do site</p>
          <hr style="border: none; border-top: 1px solid #e8e8e4; margin: 20px 0;" />
          <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
            <tr><td style="padding: 8px 0; color: #555; width: 160px;">Nome</td><td style="padding: 8px 0; font-weight: 600;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #555;">E-mail</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #FAB500;">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #555;">Empresa</td><td style="padding: 8px 0;">${company}</td></tr>
            ${phone ? `<tr><td style="padding: 8px 0; color: #555;">Telefone</td><td style="padding: 8px 0;">${phone}</td></tr>` : ""}
            ${volume ? `<tr><td style="padding: 8px 0; color: #555;">Volume estimado</td><td style="padding: 8px 0;">${volume}</td></tr>` : ""}
          </table>
          ${msg ? `
          <div style="margin-top: 20px; padding: 16px; background: #f9f9f7; border-radius: 8px; border-left: 3px solid #FAB500;">
            <p style="margin: 0; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${msg}</p>
          </div>` : ""}
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Erro ao enviar mensagem." }, { status: 500 });
  }
}
