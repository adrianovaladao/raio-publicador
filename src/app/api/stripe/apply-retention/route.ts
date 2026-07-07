export const dynamic = "force-dynamic";
import { auth, clerkClient } from "@clerk/nextjs/server";
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
  const stripe = getStripe();

  try {
    // Get user email from Clerk to search Stripe by email as fallback
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress ?? "";

    const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });

    // Try to find an active Stripe subscription, first by stored customer ID, then by email
    let activeSubId: string | null = null;
    let liveCustomerId: string | null = sub?.stripeCustomerId ?? null;

    if (liveCustomerId) {
      try {
        const byCustomer = await stripe.subscriptions.list({
          customer: liveCustomerId,
          status: "active",
          limit: 1,
        });
        if (byCustomer.data[0]) {
          activeSubId = byCustomer.data[0].id;
        }
      } catch {
        // Customer ID is stale (e.g. test-mode ID), fall through to email lookup
        liveCustomerId = null;
      }
    }

    // Fallback: look up customer by email in Stripe
    if (!activeSubId && userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 5 });
      for (const customer of customers.data) {
        const subs = await stripe.subscriptions.list({
          customer: customer.id,
          status: "active",
          limit: 1,
        });
        if (subs.data[0]) {
          activeSubId = subs.data[0].id;
          liveCustomerId = customer.id;
          break;
        }
      }
    }

    if (!activeSubId) {
      return NextResponse.json({ error: "Nenhuma assinatura ativa encontrada no Stripe." }, { status: 404 });
    }

    // Sync stale IDs in DB
    if (sub && (liveCustomerId !== sub.stripeCustomerId || activeSubId !== sub.stripeSubscriptionId)) {
      await prisma.subscription.update({
        where: { ownerId: userId },
        data: {
          ...(liveCustomerId && liveCustomerId !== sub.stripeCustomerId ? { stripeCustomerId: liveCustomerId } : {}),
          ...(activeSubId !== sub.stripeSubscriptionId ? { stripeSubscriptionId: activeSubId } : {}),
        },
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
