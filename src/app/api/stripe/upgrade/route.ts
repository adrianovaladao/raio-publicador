export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { PLANS, type PlanId } from "@/lib/plans";
import { getPrisma } from "@/lib/prisma";
import { sendUpgradeEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { planId } = (await req.json()) as { planId: PlanId };
    const plan = PLANS[planId];
    if (!plan) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });

    const stripe = getStripe();
    const prisma = getPrisma();

    const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });

    // No active Stripe subscription — redirect to checkout for first-time payment
    if (!sub?.stripeSubscriptionId) {
      const user = await currentUser();
      const email = user?.emailAddresses[0]?.emailAddress;

      let customerId = sub?.stripeCustomerId ?? undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({ email, metadata: { clerkId: userId } });
        customerId = customer.id;
      }

      const origin = req.nextUrl.origin;
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        currency: "brl",
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        success_url: `${origin}/configuracoes?upgrade=success`,
        cancel_url: `${origin}/configuracoes`,
        locale: "pt-BR",
        metadata: { clerkId: userId, planId },
        subscription_data: { metadata: { clerkId: userId, planId } },
      });

      if (!session.url) {
        return NextResponse.json({ error: "Não foi possível criar a sessão de pagamento." }, { status: 500 });
      }

      if (!sub) {
        await prisma.subscription.create({
          data: { ownerId: userId, plan: planId, status: "INACTIVE", creditsTotal: plan.credits, stripeCustomerId: customerId },
        });
      } else {
        await prisma.subscription.update({
          where: { ownerId: userId },
          data: { stripeCustomerId: customerId },
        });
      }

      return NextResponse.json({ redirect: true, url: session.url });
    }

    const currentPlan = sub.plan as PlanId | null;
    const currentPrice = currentPlan ? (PLANS[currentPlan]?.priceCents ?? 0) : 0;
    const isDowngrade = plan.priceCents < currentPrice;

    // Downgrade — update Stripe subscription directly, no payment needed
    if (isDowngrade) {
      const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
      const itemId = stripeSub.items.data[0]?.id;
      if (!itemId) return NextResponse.json({ error: "Item de assinatura não encontrado" }, { status: 500 });

      await stripe.subscriptions.update(sub.stripeSubscriptionId, {
        items: [{ id: itemId, price: plan.stripePriceId }],
        proration_behavior: "none",
        metadata: { clerkId: userId, planId },
      });

      // DB: update plan only — keep current credits until renewal cycle
      await prisma.subscription.update({
        where: { ownerId: userId },
        data: { plan: planId },
      });

      return NextResponse.json({ ok: true });
    }

    // Upgrade — update existing subscription directly and invoice immediately
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
    const itemId = stripeSub.items.data[0]?.id;
    if (!itemId) return NextResponse.json({ error: "Item de assinatura não encontrado" }, { status: 500 });

    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      items: [{ id: itemId, price: plan.stripePriceId }],
      proration_behavior: "always_invoice",
      metadata: { clerkId: userId, planId },
    });

    // Update DB immediately — don't wait for webhook (may not arrive in some envs).
    // creditsUsed intentionally NOT reset: user keeps current-cycle usage.
    await prisma.subscription.update({
      where: { ownerId: userId },
      data: { plan: planId, creditsTotal: plan.credits },
    });

    const user = await currentUser();
    const firstName = user?.firstName ?? user?.emailAddresses[0]?.emailAddress?.split("@")[0] ?? "usuário";
    const email = user?.emailAddresses[0]?.emailAddress;
    if (email) {
      await sendUpgradeEmail(email, firstName, plan.label, plan.credits).catch(console.error);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("[stripe/upgrade]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
