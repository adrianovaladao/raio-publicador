/**
 * Rota temporária de provisionamento manual de usuário.
 * DELETAR após uso.
 */
export const dynamic = "force-dynamic";
import { clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const PROVISION_SECRET = process.env.PROVISION_SECRET ?? "";

export async function POST(req: Request) {
  const { secret, userId, voucherCode } = await req.json() as {
    secret: string;
    userId: string;
    voucherCode?: string;
  };

  if (!PROVISION_SECRET || secret !== PROVISION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrisma();
  const results: string[] = [];

  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    results.push(`clerk: user ${user.emailAddresses[0]?.emailAddress} OK`);
  } catch (e) {
    results.push(`clerk error: ${String(e)}`);
  }

  if (voucherCode) {
    const code = voucherCode.trim().toUpperCase();
    const voucher = await prisma.voucher.findUnique({ where: { code } });

    if (!voucher) return NextResponse.json({ error: `Voucher ${code} não encontrado.`, results }, { status: 404 });
    if (voucher.expiresAt && voucher.expiresAt < new Date()) return NextResponse.json({ error: "Voucher expirado.", results }, { status: 400 });
    if (voucher.usedCount >= voucher.maxUses) return NextResponse.json({ error: "Voucher esgotado.", results }, { status: 400 });

    const alreadyUsed = await prisma.voucherRedemption.findUnique({
      where: { voucherId_userId: { voucherId: voucher.id, userId } },
    });

    if (alreadyUsed) {
      results.push(`voucher: já resgatado anteriormente`);
    } else {
      const existingSub = await prisma.subscription.findUnique({ where: { ownerId: userId } });
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.$transaction([
        prisma.voucherRedemption.create({ data: { voucherId: voucher.id, userId } }),
        prisma.voucher.update({ where: { id: voucher.id }, data: { usedCount: { increment: 1 } } }),
        existingSub
          ? prisma.subscription.update({ where: { ownerId: userId }, data: { creditsTotal: { increment: voucher.credits } } })
          : prisma.subscription.create({ data: { ownerId: userId, plan: "VOUCHER", status: "ACTIVE", creditsTotal: voucher.credits, creditsUsed: 0, currentPeriodStart: now, currentPeriodEnd: expiresAt } }),
      ]);

      results.push(`voucher: ${code} aplicado — ${voucher.credits} créditos adicionados`);
    }
  }

  return NextResponse.json({ ok: true, results });
}
