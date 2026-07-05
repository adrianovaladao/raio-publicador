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
        success_url: returnUrl ?? `${origin}/configuracoes?upgrade=success`,
        cancel_url: cancelUrl ?? `${origin}/configuracoes`,
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

      // DB: update plan and reactivate if was cancelled
      await prisma.subscription.update({
        where: { ownerId: userId },
        data: { plan: planId, status: "ACTIVE" },
      });

      return NextResponse.json({ ok: true });
    }

    // Upgrade — update existing subscription and invoice the proration immediately
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
    const itemId = stripeSub.items.data[0]?.id;
    if (!itemId) return NextResponse.json({ error: "Item de assinatura não encontrado" }, { status: 500 });

    const updatedSub = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      items: [{ id: itemId, price: plan.stripePriceId }],
      proration_behavior: "always_invoice",
      metadata: { clerkId: userId, planId },
    });

    // Retrieve the invoice that was just created directly from the subscription object
    const latestInvoiceId = typeof updatedSub.latest_invoice === "string"
      ? updatedSub.latest_invoice
      : updatedSub.latest_invoice?.id ?? null;

    if (!latestInvoiceId) {
      return NextResponse.json({ error: "Nenhuma fatura gerada pelo Stripe." }, { status: 500 });
    }

    let invoice = await stripe.invoices.retrieve(latestInvoiceId);

    // Finalize if still draft (Stripe may not have auto-finalized yet)
    if (invoice.status === "draft") {
      invoice = await stripe.invoices.finalizeInvoice(latestInvoiceId);
    }

    const origin = req.nextUrl.origin;

    if (invoice.status === "open") {
      const hostedUrl = invoice.hosted_invoice_url;
      if (hostedUrl) {
        return NextResponse.json({ redirect: true, url: hostedUrl });
      }
      // Fallback: checkout session
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: updatedSub.customer as string,
        currency: "brl",
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        success_url: returnUrl ?? `${origin}/configuracoes?upgrade=success`,
        cancel_url: cancelUrl ?? `${origin}/configuracoes`,
        locale: "pt-BR",
        metadata: { clerkId: userId, planId },
      });
      return NextResponse.json({ redirect: true, url: session.url });
    }

    if (invoice.status !== "paid") {
      return NextResponse.json({ error: `Fatura em estado inesperado: ${invoice.status}` }, { status: 500 });
    }

    // Invoice was auto-charged — update DB immediately (webhook is idempotent)
    const currentSub = await prisma.subscription.findUnique({ where: { ownerId: userId }, select: { creditsTotal: true, creditsUsed: true } });
    const oldCreditsTotal = currentSub?.creditsTotal ?? 0;
    const newPlanCredits = plan.credits;
    const periodStartMs = updatedSub.items.data[0].current_period_start * 1000;
    const periodEndMs = updatedSub.items.data[0].current_period_end * 1000;
    const fraction = Math.max(0, Math.min(1, (periodEndMs - Date.now()) / (periodEndMs - periodStartMs)));
    const addition = Math.max(0, Math.round((newPlanCredits - oldCreditsTotal) * fraction));

    await prisma.subscription.update({
      where: { ownerId: userId },
      data: {
        plan: planId,
        status: "ACTIVE",
        ...(addition > 0 ? { creditsTotal: { increment: addition } } : {}),
        currentPeriodStart: new Date(periodStartMs),
        currentPeriodEnd: new Date(periodEndMs),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("[stripe/upgrade]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
