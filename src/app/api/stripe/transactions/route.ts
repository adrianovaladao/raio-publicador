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

  // Checkout Sessions → compras de créditos avulsos (metadata fica na session, não no charge)
  const sessions = await stripe.checkout.sessions.list({ customer: sub.stripeCustomerId, limit: 100 });
  for (const sess of sessions.data) {
    if (sess.payment_status !== "paid") continue;
    const meta = sess.metadata ?? {};
    if (meta.type !== "credit_purchase" && !meta.creditQty) continue;
    const qty = meta.creditQty ? parseInt(meta.creditQty, 10) : null;
    const planId = meta.planId ?? sub.plan ?? "";
    const planLabel = PLAN_LABELS[planId] ?? "";
    const planSuffix = planLabel ? ` · Plano ${planLabel}` : "";
    // Busca o charge vinculado para obter receipt_url e amount real
    const pi = sess.payment_intent as string | null;
    let receiptUrl: string | null = null;
    let amount = sess.amount_total ?? 0;
    let currency = sess.currency ?? "brl";
    if (pi) {
      try {
        const chargesForPi = await stripe.charges.list({ payment_intent: pi, limit: 1 });
        const ch = chargesForPi.data[0];
        if (ch) { receiptUrl = ch.receipt_url ?? null; amount = ch.amount; currency = ch.currency; }
      } catch { /* ignore */ }
    }
    rows.push({
      id: sess.id,
      date: new Date(sess.created * 1000).toISOString(),
      type: "credits",
      description: qty ? `${qty.toLocaleString("pt-BR")} créditos avulsos${planSuffix}` : `Créditos avulsos${planSuffix}`,
      amount,
      currency,
      status: "paid",
      receiptUrl,
    });
  }

  // Fetch refunds (subscription cancellation refunds via Art. 49 CDC)
  const refunds = await stripe.refunds.list({ limit: 100 });
  const invoicePaymentIntents = new Set(
    invoices.data
      .map(inv => (inv as unknown as { payment_intent?: string }).payment_intent)
      .filter(Boolean)
  );
  for (const refund of refunds.data) {
    const pi = (refund as unknown as { payment_intent?: string }).payment_intent;
    if (!pi || !invoicePaymentIntents.has(pi)) continue;
    rows.push({
      id: refund.id,
      date: new Date(refund.created * 1000).toISOString(),
      type: "refund",
      description: "Reembolso de assinatura (Art. 49 CDC)",
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status ?? "succeeded",
      receiptUrl: null,
    });
  }

  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json(rows);
}
