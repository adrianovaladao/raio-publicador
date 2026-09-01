export const dynamic = "force-dynamic";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const ADMIN_EMAIL = "raiopublicador@gmail.com";
export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json() as { code: string };
  if (!code?.trim()) return NextResponse.json({ error: "Código inválido." }, { status: 400 });

  const prisma = getPrisma();
  const voucher = await prisma.voucher.findUnique({ where: { code: code.trim().toUpperCase() } });

  if (!voucher) return NextResponse.json({ error: "Código não encontrado." }, { status: 404 });
  if (voucher.expiresAt && voucher.expiresAt < new Date())
    return NextResponse.json({ error: "Este código expirou." }, { status: 400 });
  if (voucher.usedCount >= voucher.maxUses)
    return NextResponse.json({ error: "Este código já atingiu o limite de usos." }, { status: 400 });

  const alreadyUsed = await prisma.voucherRedemption.findUnique({
    where: { voucherId_userId: { voucherId: voucher.id, userId } },
  });
  if (alreadyUsed) return NextResponse.json({ error: "Você já resgatou este código." }, { status: 400 });

  const existingSub = await prisma.subscription.findUnique({ where: { ownerId: userId } });
  const isNewUser = !existingSub;

  // Credits applied in full — no cap
  const creditsToAdd = voucher.credits;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.voucherRedemption.create({ data: { voucherId: voucher.id, userId } }),
    prisma.voucher.update({ where: { id: voucher.id }, data: { usedCount: { increment: 1 } } }),
    isNewUser
      ? prisma.subscription.create({
          data: {
            ownerId:            userId,
            plan:               "VOUCHER",
            status:             "ACTIVE",
            creditsTotal:       creditsToAdd,
            creditsUsed:        0,
            currentPeriodStart: now,
            currentPeriodEnd:   expiresAt,
          },
        })
      : prisma.subscription.update({
          where: { ownerId: userId },
          data: { creditsTotal: { increment: creditsToAdd } },
        }),
  ]);

  // Notifica admin
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const userName = user.firstName ?? user.emailAddresses[0]?.emailAddress?.split("@")[0] ?? "usuário";
    const userEmail = user.emailAddresses[0]?.emailAddress ?? "—";
    await resend.emails.send({
      from: "Raio Publicador <noreply@raiopublicador.com.br>",
      to: ADMIN_EMAIL,
      subject: `🎟️ Voucher resgatado — ${voucher.code} (${userName})`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;padding:24px">
        <h2 style="margin:0 0 16px">🎟️ Voucher resgatado!</h2>
        <table style="font-size:14px;color:#333;border-collapse:collapse;width:100%">
          <tr><td style="padding:6px 0;color:#888;width:130px">Usuário</td><td style="padding:6px 0;font-weight:600">${userName}</td></tr>
          <tr><td style="padding:6px 0;color:#888">E-mail</td><td style="padding:6px 0"><a href="mailto:${userEmail}" style="color:#c97b00">${userEmail}</a></td></tr>
          <tr><td style="padding:6px 0;color:#888">Código</td><td style="padding:6px 0;font-weight:600;font-family:monospace">${voucher.code}</td></tr>
          <tr><td style="padding:6px 0;color:#888">Créditos</td><td style="padding:6px 0;font-weight:600">${creditsToAdd.toLocaleString("pt-BR")}</td></tr>
          <tr><td style="padding:6px 0;color:#888">Novo usuário?</td><td style="padding:6px 0">${isNewUser ? "Sim — conta criada agora" : "Não — já tinha assinatura"}</td></tr>
          <tr><td style="padding:6px 0;color:#888">Data</td><td style="padding:6px 0">${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td></tr>
        </table>
      </div>`,
    });
  } catch { /* silencioso — não bloqueia o resgate */ }

  return NextResponse.json({ credits: creditsToAdd });
}
