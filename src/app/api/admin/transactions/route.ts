export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { assertAnyAdmin } from "@/lib/admin-server";
import { NextResponse } from "next/server";

const PLAN_LABELS: Record<string, string> = { BASIC: "Básico", ADVANCED: "Avançado", PROFESSIONAL: "Profissional", VOUCHER: "Voucher" };
const PRICE_TO_PLAN: Record<number, string> = { 100000: "Básico", 300000: "Avançado", 500000: "Profissional" };

export async function GET() {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prisma = getPrisma();
  const stripe = getStripe();

  // Get all subscriptions with Stripe customer IDs
  const subs = await prisma.subscription.findMany({
    select: { ownerId: true, stripeCustomerId: true, plan: true },
  });

  // Build map: stripeCustomerId → { ownerId, plan }
  const customerMap = new Map<string, { ownerId: string; plan: string }>();
  for (const s of subs) {
    if (s.stripeCustomerId) customerMap.set(s.stripeCustomerId, { ownerId: s.ownerId, plan: s.plan });
  }

  type TxRow = {
    id: string;
    date: string;
    type: "subscription" | "credits" | "refund" | "voucher";
    description: string;
    amount: number; // in cents
    currency: string;
    status: string;
    plan: string;
    ownerId: string;
    receiptUrl: string | null;
  };

  const rows: TxRow[] = [];

  // Fetch all recent invoices (subscriptions)
  const invoices = await stripe.invoices.list({ limit: 100 });
  for (const inv of invoices.data) {
    if (inv.amount_paid === 0) continue;
    const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id ?? "";
    const info = customerMap.get(customerId);
    if (!info) continue;

    const billingReason = (inv as unknown as { billing_reason?: string }).billing_reason ?? "";
    const planLabel = PRICE_TO_PLAN[inv.amount_paid] ?? PLAN_LABELS[info.plan] ?? info.plan;
    let description = `Assinatura · ${planLabel}`;
    if (billingReason === "subscription_cycle") description = `Renovação · ${planLabel}`;
    else if (billingReason === "subscription_create") description = `Primeiro pagamento · ${planLabel}`;
    else if (billingReason === "subscription_update") description = `Upgrade · ${planLabel}`;

    rows.push({
      id: inv.id,
      date: new Date(inv.created * 1000).toISOString(),
      type: "subscription",
      description,
      amount: inv.amount_paid,
      currency: inv.currency,
      status: inv.status ?? "paid",
      plan: info.plan,
      ownerId: info.ownerId,
      receiptUrl: inv.hosted_invoice_url ?? null,
    });
  }

  // Fetch all recent checkout sessions (credit purchases)
  const sessions = await stripe.checkout.sessions.list({ limit: 100 });
  for (const sess of sessions.data) {
    if (sess.payment_status !== "paid") continue;
    const meta = sess.metadata ?? {};
    if (meta.type !== "credit_purchase" && !meta.creditQty) continue;
    const customerId = typeof sess.customer === "string" ? sess.customer : sess.customer?.id ?? "";
    const info = customerMap.get(customerId);
    if (!info) continue;

    const qty = meta.creditQty ? parseInt(meta.creditQty, 10) : null;
    const planLabel = PLAN_LABELS[info.plan] ?? info.plan;
    rows.push({
      id: sess.id,
      date: new Date(sess.created * 1000).toISOString(),
      type: "credits",
      description: qty ? `${qty.toLocaleString("pt-BR")} créditos avulsos · ${planLabel}` : `Créditos avulsos · ${planLabel}`,
      amount: sess.amount_total ?? 0,
      currency: sess.currency ?? "brl",
      status: "paid",
      plan: info.plan,
      ownerId: info.ownerId,
      receiptUrl: null,
    });
  }

  // Add VOUCHER activations from DB (non-Stripe, zero-cost)
  const voucherSubs = subs.filter(s => s.plan === "VOUCHER");
  for (const s of voucherSubs) {
    const sub = await prisma.subscription.findUnique({
      where: { ownerId: s.ownerId },
      select: { createdAt: true, creditsTotal: true },
    });
    if (!sub) continue;
    rows.push({
      id: `voucher-${s.ownerId}`,
      date: sub.createdAt.toISOString(),
      type: "voucher",
      description: `Ativação de voucher · ${sub.creditsTotal} créditos`,
      amount: 0,
      currency: "brl",
      status: "active",
      plan: "VOUCHER",
      ownerId: s.ownerId,
      receiptUrl: null,
    });
  }

  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Revenue summary
  const totalRevenueCents = rows
    .filter(r => r.type !== "voucher")
    .reduce((acc, r) => acc + r.amount, 0);

  return NextResponse.json({ rows, totalRevenueCents });
}
