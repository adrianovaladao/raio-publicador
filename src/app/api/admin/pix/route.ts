export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { isAnyAdmin } from "@/lib/admin";
import { PLANS, type PlanId } from "@/lib/plans";
import { NextRequest, NextResponse } from "next/server";

async function checkAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return isAnyAdmin(user?.publicMetadata as Record<string, unknown>);
}

// GET — lista pagamentos Pix pendentes
export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const prisma = getPrisma();
  const payments = await prisma.pixPayment.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ payments });
}

// POST — confirmar ou rejeitar
export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { userId } = await auth();

  const { paymentId, action } = (await req.json()) as {
    paymentId: string;
    action: "confirm" | "reject";
  };

  const prisma = getPrisma();
  const payment = await prisma.pixPayment.findUnique({ where: { id: paymentId } });
  if (!payment) return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 });
  if (payment.status !== "PENDING") {
    return NextResponse.json({ error: "Pagamento já processado" }, { status: 409 });
  }

  if (action === "reject") {
    await prisma.pixPayment.update({
      where: { id: paymentId },
      data: { status: "REJECTED", confirmedAt: new Date(), confirmedBy: userId },
    });
    return NextResponse.json({ ok: true });
  }

  // Confirmar — ativa ou cria assinatura
  const plan = PLANS[payment.planId as PlanId];
  if (!plan) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });

  const sub = await prisma.subscription.findUnique({ where: { ownerId: payment.ownerId } });
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

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
    where: { id: paymentId },
    data: { status: "CONFIRMED", confirmedAt: now, confirmedBy: userId },
  });

  return NextResponse.json({ ok: true });
}
