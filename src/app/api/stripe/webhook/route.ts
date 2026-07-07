export const dynamic = "force-dynamic";
import { getStripe } from "@/lib/stripe";
import { PLANS, type PlanId } from "@/lib/plans";
import { getPrisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  sendWelcomeEmail,
  sendRenewalEmail,
  sendPaymentFailedEmail,
  sendUpgradeEmail,
} from "@/lib/email";

async function getClerkUser(clerkId: string) {
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(clerkId);
  const firstName = user.firstName ?? user.emailAddresses[0]?.emailAddress?.split("@")[0] ?? "usuário";
  const email = user.emailAddresses[0]?.emailAddress ?? "";
  return { firstName, email };
}

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

      const oldSubscriptionId = session.metadata?.oldSubscriptionId;
      const isUpgrade = !!(oldSubscriptionId && oldSubscriptionId !== subscriptionId);

      // Cancela assinatura anterior se for upgrade
      if (isUpgrade) {
        await stripe.subscriptions.cancel(oldSubscriptionId!).catch(console.error);
      }

      if (isUpgrade) {
        // Upgrade além do teto: adiciona créditos do novo plano ao saldo disponível existente
        const current = await prisma.subscription.findUnique({
          where: { ownerId: clerkId },
          select: { creditsTotal: true, creditsUsed: true, highestPlan: true },
        });
        const available = Math.max(0, (current?.creditsTotal ?? 0) - (current?.creditsUsed ?? 0));
        const currentHighestPrice = current?.highestPlan ? (PLANS[current.highestPlan as PlanId]?.priceCents ?? 0) : 0;
        const newHighestPlan = PLANS[planId].priceCents > currentHighestPrice ? planId : (current?.highestPlan ?? planId);
        await prisma.subscription.update({
          where: { ownerId: clerkId },
          data: {
            plan: planId,
            highestPlan: newHighestPlan,
            status: "ACTIVE",
            creditsTotal: available + PLANS[planId].credits,
            creditsUsed: 0,
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: new Date(subscription.items.data[0].current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
          },
        });
        const { firstName, email } = await getClerkUser(clerkId);
        if (email) {
          await sendUpgradeEmail(email, firstName, PLANS[planId].label, PLANS[planId].credits).catch(console.error);
        }
      } else {
        // Nova assinatura: define créditos do plano e seta highestPlan inicial
        await prisma.subscription.update({
          where: { ownerId: clerkId },
          data: {
            plan: planId,
            highestPlan: planId,
            status: "ACTIVE",
            creditsTotal: PLANS[planId].credits,
            creditsUsed: 0,
            stripeSubscriptionId: subscription.id,
            currentPeriodStart: new Date(subscription.items.data[0].current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
          },
        });
        const { firstName, email } = await getClerkUser(clerkId);
        if (email) {
          const nextRenewal = new Date(subscription.items.data[0].current_period_end * 1000);
          await sendWelcomeEmail(email, firstName, PLANS[planId].label, PLANS[planId].priceCents, PLANS[planId].credits, nextRenewal).catch(console.error);
        }
      }
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

      const billingReason = (invoice as unknown as { billing_reason?: string }).billing_reason;
      const periodStartMs = subscription.items.data[0].current_period_start * 1000;
      const periodEndMs = subscription.items.data[0].current_period_end * 1000;
      const periodEnd = new Date(periodEndMs);

      if (billingReason === "subscription_cycle") {
        // Renewal: reset credits fully to new plan allocation
        await prisma.subscription.update({
          where: { ownerId: clerkId },
          data: {
            plan: planId,
            status: "ACTIVE",
            creditsTotal: PLANS[planId].credits,
            creditsUsed: 0,
            currentPeriodStart: new Date(periodStartMs),
            currentPeriodEnd: periodEnd,
          },
        });
        const { firstName, email } = await getClerkUser(clerkId);
        if (email) {
          await sendRenewalEmail(email, firstName, PLANS[planId].label, PLANS[planId].credits, periodEnd).catch(console.error);
        }
      }
      // billing_reason === "subscription_create" and "subscription_update" are handled by checkout.session.completed
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

      const planId = subscription.metadata?.planId as PlanId | undefined;
      const { firstName, email } = await getClerkUser(clerkId);
      if (email) {
        await sendPaymentFailedEmail(email, firstName, planId ? PLANS[planId]?.label : "atual").catch(console.error);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const clerkId = subscription.metadata?.clerkId;
      const planId = subscription.metadata?.planId as PlanId | undefined;
      if (!clerkId || !planId || !PLANS[planId]) break;

      // Only update plan and dates here — credits are handled by invoice.payment_succeeded
      await prisma.subscription.update({
        where: { ownerId: clerkId },
        data: {
          plan: planId,
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

      // Only cancel if this is still the active subscription — ignore deletions of old subscriptions during upgrades
      const current = await prisma.subscription.findUnique({ where: { ownerId: clerkId }, select: { stripeSubscriptionId: true } });
      if (current?.stripeSubscriptionId === subscription.id) {
        await prisma.subscription.update({ where: { ownerId: clerkId }, data: { status: "CANCELLED" } });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
