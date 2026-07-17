export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const VOUCHER_CREDIT_CAP = 100;

export async function POST(req: Request) {
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

  // New users get the VOUCHER plan (capped at 100 credits); existing subscribers just get credits added
  const creditsToAdd = isNewUser
    ? Math.min(voucher.credits, VOUCHER_CREDIT_CAP)
    : voucher.credits;

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

  return NextResponse.json({ credits: creditsToAdd });
}
