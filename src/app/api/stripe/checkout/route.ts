export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { PLANS, type PlanId } from "@/lib/plans";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = (await req.json()) as { planId: PlanId };
  const plan = PLANS[planId];
  if (!plan) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  const stripe = getStripe();
  const prisma = getPrisma();

  const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });

  let customerId = sub?.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({ email, metadata: { clerkId: userId } });
    customerId = customer.id;
  }

  const origin = req.nextUrl.origin;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${origin}/boas-vindas?checkout=success`,
    cancel_url: `${origin}/site#planos`,
    locale: "pt-BR",
    metadata: { clerkId: userId, planId },
    subscription_data: { metadata: { clerkId: userId, planId } },
  });

  if (!sub) {
    await prisma.subscription.create({
      data: { ownerId: userId, plan: planId, status: "INACTIVE", creditsTotal: plan.credits, stripeCustomerId: customerId },
    });
  }

  return NextResponse.json({ url: session.url });
}
