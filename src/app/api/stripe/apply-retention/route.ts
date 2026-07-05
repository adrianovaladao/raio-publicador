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
  if (!sub?.stripeSubscriptionId) {
    return NextResponse.json({ error: "Assinatura não encontrada." }, { status: 404 });
  }

  const stripe = getStripe();

  // Create a one-time coupon for 30 days
  const coupon = await stripe.coupons.create({
    percent_off: discountPct,
    duration: "once",
    name: `Retenção ${discountPct}%`,
  });

  await stripe.subscriptions.update(sub.stripeSubscriptionId, {
    discounts: [{ coupon: coupon.id }],
  });

  return NextResponse.json({ ok: true });
}
