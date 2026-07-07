export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { PLANS, type PlanId } from "@/lib/plans";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { planId, returnUrl, cancelUrl } = (await req.json()) as { planId: PlanId; returnUrl?: string; cancelUrl?: string };
    const plan = PLANS[planId];
    if (!plan) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });

    const stripe = getStripe();
    const prisma = getPrisma();
    const origin = req.nextUrl.origin;
    const successUrl = returnUrl ?? `${origin}/configuracoes?upgrade=success`;
    const cancelUrlFinal = cancelUrl ?? `${origin}/configuracoes`;

    const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });

    // ── Sem assinatura Stripe → primeiro checkout ──────────────────────────
    if (!sub?.stripeSubscriptionId) {
      const user = await currentUser();
      const email = user?.emailAddresses[0]?.emailAddress;

      let customerId = sub?.stripeCustomerId ?? undefined;
      if (!customerId) {
        const customer = await stripe.customers.create({ email, metadata: { clerkId: userId } });
        customerId = customer.id;
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        currency: "brl",
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrlFinal,
        locale: "pt-BR",
        metadata: { clerkId: userId, planId },
        subscription_data: { metadata: { clerkId: userId, planId } },
      });

      if (!session.url) return NextResponse.json({ error: "Não foi possível criar a sessão de pagamento." }, { status: 500 });

      if (!sub) {
        await prisma.subscription.create({
          data: { ownerId: userId, plan: planId, status: "INACTIVE", creditsTotal: plan.credits, stripeCustomerId: customerId },
        });
      } else {
        await prisma.subscription.update({ where: { ownerId: userId }, data: { stripeCustomerId: customerId } });
      }

      return NextResponse.json({ redirect: true, url: session.url });
    }

    const currentPlan = sub.plan as PlanId | null;
    const currentPrice = currentPlan ? (PLANS[currentPlan]?.priceCents ?? 0) : 0;
    const isDowngrade = plan.priceCents < currentPrice;

    // ── Downgrade → sem cobrança ───────────────────────────────────────────
    if (isDowngrade) {
      const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
      const itemId = stripeSub.items.data[0]?.id;
      if (!itemId) return NextResponse.json({ error: "Item de assinatura não encontrado" }, { status: 500 });

      await stripe.subscriptions.update(sub.stripeSubscriptionId, {
        items: [{ id: itemId, price: plan.stripePriceId }],
        proration_behavior: "none",
        metadata: { clerkId: userId, planId },
      });

      await prisma.subscription.update({
        where: { ownerId: userId },
        data: { plan: planId, status: "ACTIVE" },
      });

      return NextResponse.json({ ok: true });
    }

    // ── Upgrade → novo checkout com preço integral; cancela assinatura antiga no webhook ──
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: sub.stripeCustomerId!,
      currency: "brl",
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrlFinal,
      locale: "pt-BR",
      metadata: { clerkId: userId, planId, oldSubscriptionId: sub.stripeSubscriptionId },
      subscription_data: { metadata: { clerkId: userId, planId, oldSubscriptionId: sub.stripeSubscriptionId } },
    });

    if (!session.url) return NextResponse.json({ error: "Não foi possível criar a sessão de pagamento." }, { status: 500 });
    return NextResponse.json({ redirect: true, url: session.url });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("[stripe/upgrade]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
