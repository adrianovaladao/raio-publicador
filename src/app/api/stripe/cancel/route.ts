export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const REFUND_WINDOW_DAYS = 7;

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });
  if (!sub?.stripeSubscriptionId) return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });

  const stripe = getStripe();
  const now = new Date();
  const periodStart = sub.currentPeriodStart ?? null;
  const daysSincePeriodStart = periodStart
    ? (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;
  const eligibleForRefund = daysSincePeriodStart <= REFUND_WINDOW_DAYS;

  if (eligibleForRefund) {
    // Within 7-day window (Art. 49 CDC): cancel immediately + full refund
    const invoices = await stripe.invoices.list({ subscription: sub.stripeSubscriptionId, limit: 1 });
    const lastInvoice = invoices.data[0] as unknown as { payment_intent?: string | null };
    if (lastInvoice?.payment_intent && typeof lastInvoice.payment_intent === "string") {
      await stripe.refunds.create({ payment_intent: lastInvoice.payment_intent });
    }
    await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
    await prisma.subscription.update({
      where: { ownerId: userId },
      data: { status: "CANCELLED", creditsTotal: 0, creditsUsed: 0 },
    });
    return NextResponse.json({ ok: true, refunded: true, periodEnd: null });
  } else {
    // After 7 days: cancel at period end, access maintained
    await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
    await prisma.subscription.update({
      where: { ownerId: userId },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ ok: true, refunded: false, periodEnd: sub.currentPeriodEnd?.toISOString() ?? null });
  }
}
