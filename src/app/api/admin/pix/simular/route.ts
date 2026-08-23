export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isAnyAdmin } from "@/lib/admin";
import { getPrisma } from "@/lib/prisma";
import { PLANS, type PlanId } from "@/lib/plans";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/pix/simular
 * Simula um pagamento Pix confirmado (sandbox apenas).
 * Dispara a mesma lógica que o webhook do C6 Bank executaria.
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await currentUser();
  if (!isAnyAdmin(user?.publicMetadata as Record<string, unknown>)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (process.env.C6_ENV !== "sandbox") {
    return NextResponse.json({ error: "Simulação disponível apenas em sandbox" }, { status: 403 });
  }

  const { txId } = (await req.json()) as { txId: string };
  if (!txId) return NextResponse.json({ error: "txId obrigatório" }, { status: 400 });

  const prisma = getPrisma();
  const payment = await prisma.pixPayment.findFirst({
    where: { txId, status: "PENDING" },
  });

  if (!payment) {
    return NextResponse.json({ error: "Pagamento não encontrado ou já processado" }, { status: 404 });
  }

  const plan = PLANS[payment.planId as PlanId];
  if (!plan) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const sub = await prisma.subscription.findUnique({ where: { ownerId: payment.ownerId } });

  if (sub) {
    await prisma.subscription.update({
      where: { ownerId: payment.ownerId },
      data: {
        plan: payment.planId as PlanId,
        status: "ACTIVE",
        creditsTotal: plan.credits,
        creditsUsed: 0,
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth,
      },
    });
  } else {
    await prisma.subscription.create({
      data: {
        ownerId: payment.ownerId,
        plan: payment.planId as PlanId,
        status: "ACTIVE",
        creditsTotal: plan.credits,
        creditsUsed: 0,
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth,
      },
    });
  }

  await prisma.pixPayment.update({
    where: { id: payment.id },
    data: { status: "CONFIRMED", confirmedAt: now, confirmedBy: "sandbox-simulation" },
  });

  return NextResponse.json({ ok: true, ownerId: payment.ownerId, planId: payment.planId });
}
