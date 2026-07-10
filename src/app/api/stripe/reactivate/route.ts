export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });

  if (!sub?.stripeSubscriptionId) {
    return NextResponse.json({ error: "Assinatura não encontrada." }, { status: 404 });
  }

  if (sub.status !== "CANCELLED") {
    return NextResponse.json({ error: "Assinatura não está cancelada." }, { status: 400 });
  }

  const stripe = getStripe();

  // Check the actual Stripe subscription status
  let stripeSub;
  try {
    stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
  } catch (e) {
    console.error("[reactivate] retrieve error", e);
    return NextResponse.json({ error: "Assinatura não encontrada no Stripe." }, { status: 404 });
  }

  const stripeStatus = (stripeSub as unknown as { status: string }).status;

  if (stripeStatus === "canceled") {
    // Subscription was fully cancelled (refund case) — cannot reactivate, must re-subscribe
    return NextResponse.json({ error: "FULLY_CANCELLED" }, { status: 409 });
  }

  try {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
  } catch (e) {
    console.error("[reactivate] update error", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  await prisma.subscription.update({
    where: { ownerId: userId },
    data: { status: "ACTIVE" },
  });

  return NextResponse.json({ ok: true });
}
