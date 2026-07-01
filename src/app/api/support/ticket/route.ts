export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subject, description, conversationId } = await req.json() as {
    subject: string;
    description: string;
    conversationId?: string;
  };

  if (!subject?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Assunto e descrição são obrigatórios." }, { status: 400 });
  }

  const prisma = getPrisma();
  const user = await currentUser();
  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Usuário";
  const userEmail = user?.emailAddresses[0]?.emailAddress ?? "";

  // Ensure conversation exists
  let convId = conversationId;
  if (!convId) {
    const conv = await prisma.supportConversation.create({ data: { ownerId: userId } });
    convId = conv.id;
  }

  // Check if ticket already exists for this conversation
  const existing = await prisma.supportTicket.findUnique({ where: { conversationId: convId } });
  if (existing) return NextResponse.json({ error: "Já existe um ticket para esta conversa." }, { status: 409 });

  const ticket = await prisma.supportTicket.create({
    data: { conversationId: convId, ownerId: userId, subject, description },
  });

  // Send email notification
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Raio Publicador <onboarding@resend.dev>",
    to: "adrianojvfreitas@gmail.com",
    subject: `[Ticket #${ticket.id.slice(-6).toUpperCase()}] ${subject}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
        <h2 style="margin:0 0 8px;font-size:20px">Novo ticket de suporte</h2>
        <p style="margin:0 0 24px;color:#555;font-size:14px">Protocolo: <strong>#${ticket.id.slice(-6).toUpperCase()}</strong></p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#888;width:120px">Usuário</td><td style="padding:8px 0"><strong>${userName}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#888">E-mail</td><td style="padding:8px 0">${userEmail}</td></tr>
          <tr><td style="padding:8px 0;color:#888">Assunto</td><td style="padding:8px 0"><strong>${subject}</strong></td></tr>
        </table>
        <div style="margin-top:24px;padding:16px;background:#f5f5f5;border-radius:8px;font-size:14px;line-height:1.6">
          ${description.replace(/\n/g, "<br>")}
        </div>
      </div>
    `,
  });

  // Also send confirmation to user
  if (userEmail) {
    await resend.emails.send({
      from: "Raio Publicador <onboarding@resend.dev>",
      to: userEmail,
      subject: `Recebemos seu ticket — Protocolo #${ticket.id.slice(-6).toUpperCase()}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
          <h2 style="margin:0 0 8px;font-size:20px">Ticket recebido ✓</h2>
          <p style="margin:0 0 16px;color:#555;font-size:15px">
            Olá, <strong>${userName}</strong>! Recebemos seu ticket e entraremos em contato em breve.
          </p>
          <p style="margin:0 0 24px;font-size:14px;color:#888">
            Protocolo: <strong style="color:#1a1a1a">#${ticket.id.slice(-6).toUpperCase()}</strong>
          </p>
          <p style="margin:0;font-size:13px;color:#999">Nossa equipe atende de seg a sex, das 8h às 18h (horário de Brasília).</p>
        </div>
      `,
    });
  }

  return NextResponse.json({ ticketId: ticket.id, protocol: ticket.id.slice(-6).toUpperCase() }, { status: 201 });
}
