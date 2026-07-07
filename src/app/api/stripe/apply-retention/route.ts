export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { discountPct } = (await req.json()) as { discountPct: number };
  if (!discountPct || discountPct <= 0 || discountPct >= 100) {
    return NextResponse.json({ error: "Desconto inválido" }, { status: 400 });
  }

  const prisma = getPrisma();
  const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: "Assinatura não encontrada." }, { status: 404 });
  }

  const stripe = getStripe();

  try {
    // Find the active subscription from Stripe directly (avoids stale DB IDs from test mode)
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: sub.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    const activeSubId = stripeSubscriptions.data[0]?.id ?? sub.stripeSubscriptionId;
    if (!activeSubId) {
      return NextResponse.json({ error: "Nenhuma assinatura ativa encontrada no Stripe." }, { status: 404 });
    }

    // Sync the subscription ID in DB if it was stale
    if (stripeSubscriptions.data[0]?.id && stripeSubscriptions.data[0].id !== sub.stripeSubscriptionId) {
      await prisma.subscription.update({
        where: { ownerId: userId },
        data: { stripeSubscriptionId: stripeSubscriptions.data[0].id },
      });
    }

    const coupon = await stripe.coupons.create({
      percent_off: discountPct,
      duration: "once",
      name: `Retencao ${discountPct}pct`,
    });

    await stripe.subscriptions.update(activeSubId, {
      discounts: [{ coupon: coupon.id }],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[apply-retention] Stripe error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
