export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { PLANS } from "@/lib/plans";
import { NextResponse } from "next/server";

const PLAN_LABELS: Record<string, string> = { BASIC: "Básico", ADVANCED: "Avançado", PROFESSIONAL: "Profissional" };

export type CreditHistoryRow = {
  id: string;
  date: string;
  direction: "in" | "out";
  description: string;
  credits: number;
  detail?: string;
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const rows: CreditHistoryRow[] = [];

  // ── Saídas: créditos usados em releases ──────────────────────────────────
  const releases = await prisma.release.findMany({
    where: { authorId: userId, creditsUsed: { gt: 0 } },
    select: {
      id: true, title: true, creditsUsed: true,
      status: true, scheduledAt: true, createdAt: true,
      brand: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  for (const r of releases) {
    rows.push({
      id: `rel-${r.id}`,
      date: (r.scheduledAt ?? r.createdAt).toISOString(),
      direction: "out",
      description: r.title,
      credits: r.creditsUsed,
      detail: r.brand?.name ?? undefined,
    });
  }

  // ── Entradas: assinatura e créditos avulsos via Stripe ───────────────────
  const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });
  if (sub?.stripeCustomerId) {
    try {
      const stripe = getStripe();

      // Invoices → créditos de assinatura (renovação / primeiro pagamento / upgrade)
      // Filtra apenas faturas da assinatura atual para evitar duplicatas de assinaturas anteriores
      const invoiceParams: Parameters<typeof stripe.invoices.list>[0] = { customer: sub.stripeCustomerId, limit: 100 };
      if (sub.stripeSubscriptionId) invoiceParams.subscription = sub.stripeSubscriptionId;
      const invoices = await stripe.invoices.list(invoiceParams);
      for (const inv of invoices.data) {
        if (inv.amount_paid === 0) continue;

        let planId = sub.plan;
        const subscriptionId = (inv as unknown as { subscription?: string }).subscription;
        if (subscriptionId && subscriptionId !== sub.stripeSubscriptionId) {
          try {
            const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
            if (stripeSub.metadata?.planId) planId = stripeSub.metadata.planId as typeof planId;
          } catch { /* ignore */ }
        }

        const plan = PLANS[planId as keyof typeof PLANS];
        if (!plan) continue;

        const billingReason = (inv as unknown as { billing_reason?: string }).billing_reason ?? "";
        let desc = `Assinatura · ${PLAN_LABELS[planId] ?? planId}`;
        if (billingReason === "subscription_cycle")  desc = `Renovação · ${PLAN_LABELS[planId] ?? planId}`;
        if (billingReason === "subscription_create") desc = `Início de assinatura · ${PLAN_LABELS[planId] ?? planId}`;
        if (billingReason === "subscription_update") desc = `Upgrade de plano · ${PLAN_LABELS[planId] ?? planId}`;

        rows.push({
          id: `inv-${inv.id}`,
          date: new Date(inv.created * 1000).toISOString(),
          direction: "in",
          description: desc,
          credits: plan.credits,
        });
      }

      // Checkout Sessions → créditos avulsos (metadata fica na session, não no charge)
      const sessions = await stripe.checkout.sessions.list({ customer: sub.stripeCustomerId, limit: 100 });
      for (const sess of sessions.data) {
        if (sess.payment_status !== "paid") continue;
        const meta = sess.metadata ?? {};
        if (meta.type !== "credit_purchase" && !meta.creditQty) continue;
        const qty = meta.creditQty ? parseInt(meta.creditQty, 10) : 0;
        if (!qty) continue;
        rows.push({
          id: `sess-${sess.id}`,
          date: new Date(sess.created * 1000).toISOString(),
          direction: "in",
          description: `Créditos avulsos · ${qty.toLocaleString("pt-BR")} cr`,
          credits: qty,
        });
      }
    } catch { /* Stripe indisponível — retorna só as saídas */ }
  }

  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return NextResponse.json(rows);
}
