export const dynamic = "force-dynamic";
import { getStripe } from "@/lib/stripe";
import { PLANS, type PlanId } from "@/lib/plans";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const prisma = getPrisma();
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event | undefined;
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_WEBHOOK_SECRET_CUSTOM].filter(Boolean) as string[];
  for (const secret of secrets) {
    try { event = stripe.webhooks.constructEvent(body, sig!, secret); break; } catch { /* tenta o próximo */ }
  }
  if (!event) {
    return NextResponse.json({ error: "Webhook signature inválida" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const clerkId = session.metadata?.clerkId;

      // Credit purchase (one-time payment)
      if (session.metadata?.type === "credit_purchase") {
        const creditQty = parseInt(session.metadata?.creditQty ?? "0", 10);
        if (clerkId && creditQty > 0) {
          await prisma.subscription.update({
            where: { ownerId: clerkId },
            data: { creditsTotal: { increment: creditQty } },
          });
        }
        break;
      }

      // Subscription checkout
      const planId = session.metadata?.planId as PlanId | undefined;
      if (!clerkId || !planId) break;

      const subscriptionId = session.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      await prisma.subscription.update({
        where: { ownerId: clerkId },
        data: {
          plan: planId,
          status: "ACTIVE",
          creditsTotal: PLANS[planId].credits,
          creditsUsed: 0,
          stripeSubscriptionId: subscription.id,
          currentPeriodStart: new Date(subscription.items.data[0].current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
        },
      });
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice as unknown as { subscription?: string }).subscription;
      if (!subscriptionId) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const clerkId = subscription.metadata?.clerkId;
      const planId = subscription.metadata?.planId as PlanId | undefined;
      if (!clerkId || !planId) break;

      await prisma.subscription.update({
        where: { ownerId: clerkId },
        data: {
          status: "ACTIVE",
          creditsTotal: PLANS[planId].credits,
          creditsUsed: 0,
          currentPeriodStart: new Date(subscription.items.data[0].current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
        },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice as unknown as { subscription?: string }).subscription;
      if (!subscriptionId) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const clerkId = subscription.metadata?.clerkId;
      if (!clerkId) break;

      await prisma.subscription.update({ where: { ownerId: clerkId }, data: { status: "PAST_DUE" } });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const clerkId = subscription.metadata?.clerkId;
      const planId = subscription.metadata?.planId as PlanId | undefined;
      if (!clerkId || !planId || !PLANS[planId]) break;

      // Detect downgrade: compare new plan price with current plan in DB
      const currentSub = await prisma.subscription.findUnique({ where: { ownerId: clerkId }, select: { plan: true, creditsTotal: true } });
      const currentPlanId = currentSub?.plan as PlanId | null;
      const currentPriceCents = currentPlanId ? (PLANS[currentPlanId]?.priceCents ?? 0) : 0;
      const isDowngrade = PLANS[planId].priceCents < currentPriceCents;

      await prisma.subscription.update({
        where: { ownerId: clerkId },
        data: {
          plan: planId,
          // On downgrade: keep current credits until renewal (invoice.payment_succeeded resets them)
          // On upgrade: reset to new plan's credits immediately
          ...(isDowngrade ? {} : { creditsTotal: PLANS[planId].credits }),
          stripeSubscriptionId: subscription.id,
          currentPeriodStart: new Date(subscription.items.data[0].current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const clerkId = subscription.metadata?.clerkId;
      if (!clerkId) break;

      await prisma.subscription.update({ where: { ownerId: clerkId }, data: { status: "CANCELLED" } });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
