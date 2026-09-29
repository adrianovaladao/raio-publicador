export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { PLANS, type PlanId } from "@/lib/plans";
import { NextRequest, NextResponse } from "next/server";

// C6 Bank Pix webhook — notificação de pagamento recebido
// Body segue spec BACEN: { pix: [{ txid, endToEndId, valor, horario, pagador, infoPagador }] }
export async function POST(req: NextRequest) {
  let body: { pix?: { txid?: string; endToEndId?: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const pixList = body?.pix;
  if (!Array.isArray(pixList) || pixList.length === 0) {
    return NextResponse.json({ ok: true }); // silently ack unknown shapes
  }

  const prisma = getPrisma();

  for (const entry of pixList) {
    const txId = entry?.txid;
    if (!txId) continue;

    const payment = await prisma.pixPayment.findFirst({ where: { txId } });
    if (!payment || payment.status !== "PENDING") continue;

    const plan = PLANS[payment.planId as PlanId];
    if (!plan) continue;

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
      data: {
        status: "CONFIRMED",
        confirmedAt: now,
        confirmedBy: "webhook:c6bank",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
