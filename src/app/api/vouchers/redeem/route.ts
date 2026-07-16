export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

  await prisma.$transaction([
    prisma.voucherRedemption.create({ data: { voucherId: voucher.id, userId } }),
    prisma.voucher.update({ where: { id: voucher.id }, data: { usedCount: { increment: 1 } } }),
    prisma.subscription.upsert({
      where: { ownerId: userId },
      update: { creditsTotal: { increment: voucher.credits } },
      create: {
        ownerId:      userId,
        plan:         "BASIC",
        status:       "INACTIVE",
        creditsTotal: voucher.credits,
        creditsUsed:  0,
      },
    }),
  ]);

  return NextResponse.json({ credits: voucher.credits });
}
