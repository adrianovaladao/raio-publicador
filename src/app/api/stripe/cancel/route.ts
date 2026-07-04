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
  if (!sub?.stripeSubscriptionId) return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });

  const stripe = getStripe();
  await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });

  await prisma.subscription.update({
    where: { ownerId: userId },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true, periodEnd: sub.currentPeriodEnd?.toISOString() ?? null });
}
