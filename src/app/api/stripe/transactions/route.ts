export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });
  if (!sub?.stripeCustomerId) return NextResponse.json([]);

  const stripe = getStripe();

  // Fetch charges (one-time payments like credit purchases)
  const charges = await stripe.charges.list({ customer: sub.stripeCustomerId, limit: 100 });

  // Fetch invoices (subscription payments)
  const invoices = await stripe.invoices.list({ customer: sub.stripeCustomerId, limit: 100 });

  type TxRow = {
    id: string;
    date: string;
    type: "subscription" | "credits" | "refund";
    description: string;
    amount: number;
    currency: string;
    status: string;
    receiptUrl: string | null;
  };

  const rows: TxRow[] = [];

  const PLAN_LABELS: Record<string, string> = { BASIC: "Básico", ADVANCED: "Avançado", PROFESSIONAL: "Profissional" };
  // Price in cents → plan name (fallback when metadata is missing)
  const PRICE_TO_PLAN: Record<number, string> = { 100000: "Básico", 300000: "Avançado", 500000: "Profissional" };

  for (const inv of invoices.data) {
    if (inv.amount_paid === 0) continue;
    const billingReason = (inv as unknown as { billing_reason?: string }).billing_reason ?? "";

    // Try subscription metadata first, then fall back to invoice amount, then current plan
    const subscriptionId = (inv as unknown as { subscription?: string }).subscription;
    let planLabel = "";
    if (subscriptionId) {
      try {
        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
        const planId = stripeSub.metadata?.planId ?? "";
        planLabel = PLAN_LABELS[planId] ?? "";
      } catch { /* ignore */ }
    }
    if (!planLabel) planLabel = PRICE_TO_PLAN[inv.amount_paid] ?? PLAN_LABELS[sub.plan] ?? "";

    const planSuffix = planLabel ? ` · Plano ${planLabel}` : "";
    let description = `Assinatura${planSuffix}`;
    if (billingReason === "subscription_cycle") description = `Renovação de assinatura${planSuffix}`;
    else if (billingReason === "subscription_create") description = `Primeiro pagamento${planSuffix}`;
    else if (billingReason === "subscription_update") description = `Upgrade de plano${planSuffix}`;

    rows.push({
      id: inv.id,
      date: new Date((inv.created) * 1000).toISOString(),
      type: "subscription",
      description,
      amount: inv.amount_paid,
      currency: inv.currency,
      status: inv.status ?? "paid",
      receiptUrl: inv.hosted_invoice_url ?? null,
    });
  }

  for (const charge of charges.data) {
    // Skip charges already covered by invoices
    if ((charge as unknown as { invoice?: string }).invoice) continue;
    const meta = charge.metadata ?? {};
    const qty = meta.creditQty ? parseInt(meta.creditQty, 10) : null;
    const planId = meta.planId ?? sub.plan ?? "";
    const planLabel = PLAN_LABELS[planId] ?? "";
    const planSuffix = planLabel ? ` · Plano ${planLabel}` : "";
    rows.push({
      id: charge.id,
      date: new Date(charge.created * 1000).toISOString(),
      type: charge.refunded ? "refund" : "credits",
      description: qty ? `${qty.toLocaleString("pt-BR")} créditos avulsos${planSuffix}` : `Créditos avulsos${planSuffix}`,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      receiptUrl: charge.receipt_url ?? null,
    });
  }

  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json(rows);
}
