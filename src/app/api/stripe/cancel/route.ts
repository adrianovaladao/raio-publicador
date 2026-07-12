export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { sendCancellationEmail } from "@/lib/email";
import { PLANS } from "@/lib/plans";
import { createNotification } from "@/lib/notify";

const REFUND_WINDOW_DAYS = 7;

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clerkUser = await currentUser();

  const prisma = getPrisma();
  const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });
  if (!sub?.stripeSubscriptionId) return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });

  const stripe = getStripe();
  const now = new Date();
  // Use currentPeriodStart from Stripe webhook; fall back to subscription createdAt
  const periodStart = sub.currentPeriodStart ?? sub.createdAt ?? null;
  const daysSincePeriodStart = periodStart
    ? (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;
  const creditsUsed = sub.creditsUsed ?? 0;
  const eligibleForRefund = daysSincePeriodStart <= REFUND_WINDOW_DAYS && creditsUsed === 0;

  if (eligibleForRefund) {
    // Within 7-day window with no credits used (Art. 49 CDC): cancel immediately + full refund + wipe data
    const invoices = await stripe.invoices.list({ subscription: sub.stripeSubscriptionId, limit: 1 });
    const lastInvoice = invoices.data[0] as unknown as { payment_intent?: string | null };
    if (lastInvoice?.payment_intent && typeof lastInvoice.payment_intent === "string") {
      await stripe.refunds.create({ payment_intent: lastInvoice.payment_intent });
    }
    await stripe.subscriptions.cancel(sub.stripeSubscriptionId);

    // Delete all user data: releases, brands, subscription
    const brands = await prisma.brand.findMany({ where: { ownerId: userId }, select: { id: true } });
    const brandIds = brands.map(b => b.id);
    await prisma.release.deleteMany({ where: { brandId: { in: brandIds } } });
    await prisma.brandMember.deleteMany({ where: { brandId: { in: brandIds } } });
    await prisma.brand.deleteMany({ where: { ownerId: userId } });
    await prisma.subscription.update({
      where: { ownerId: userId },
      data: { status: "CANCELLED", creditsTotal: 0, creditsUsed: 0 },
    });
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
    const firstName = clerkUser?.firstName ?? "Cliente";
    const planLabel = PLANS[sub.plan as keyof typeof PLANS]?.label ?? sub.plan;
    if (email) {
      await sendCancellationEmail(email, firstName, true, null, planLabel).catch(console.error);
    }
    await createNotification(userId, "subscription_cancelled",
      "Assinatura cancelada e reembolso processado",
      `Seu reembolso do Plano ${planLabel} foi processado. O valor será creditado em até 10 dias úteis.`,
      "/configuracoes?tab=cobranca",
    ).catch(console.error);
    return NextResponse.json({ ok: true, refunded: true, periodEnd: null });
  } else {
    // After 7 days: cancel at period end, access maintained
    await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
    await prisma.subscription.update({
      where: { ownerId: userId },
      data: { status: "CANCELLED" },
    });
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
    const firstName = clerkUser?.firstName ?? "Cliente";
    const planLabel = PLANS[sub.plan as keyof typeof PLANS]?.label ?? sub.plan;
    if (email) {
      await sendCancellationEmail(email, firstName, false, sub.currentPeriodEnd ?? null, planLabel).catch(console.error);
    }
    const until = sub.currentPeriodEnd
      ? sub.currentPeriodEnd.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })
      : "o fim do ciclo";
    await createNotification(userId, "subscription_cancelled",
      "Assinatura cancelada",
      `Seu acesso ao Plano ${planLabel} permanece ativo até ${until}.`,
      "/configuracoes?tab=cobranca",
    ).catch(console.error);
    return NextResponse.json({ ok: true, refunded: false, periodEnd: sub.currentPeriodEnd?.toISOString() ?? null });
  }
}
