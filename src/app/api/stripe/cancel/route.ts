export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { sendCancellationEmail } from "@/lib/email";
import { PLANS } from "@/lib/plans";
import { createNotification } from "@/lib/notify";

const REFUND_WINDOW_DAYS = 7;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clerkUser = await currentUser();

  let pixKey: string | undefined;
  let pixKeyType: string | undefined;
  try {
    const body = await req.json().catch(() => ({})) as { pixKey?: string; pixKeyType?: string };
    pixKey = body.pixKey;
    pixKeyType = body.pixKeyType;
  } catch { /* sem body */ }

  const prisma = getPrisma();
  const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });
  if (!sub) return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });

  const isPix = !sub.stripeSubscriptionId;
  const stripe = getStripe();
  const now = new Date();
  const periodStart = sub.currentPeriodStart ?? sub.createdAt ?? null;
  const daysSincePeriodStart = periodStart
    ? (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;
  const creditsUsed = sub.creditsUsed ?? 0;
  const eligibleForRefund = daysSincePeriodStart <= REFUND_WINDOW_DAYS && creditsUsed === 0;

  const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
  const firstName = clerkUser?.firstName ?? "Cliente";
  const planLabel = PLANS[sub.plan as keyof typeof PLANS]?.label ?? sub.plan;

  if (eligibleForRefund) {
    // ── Pix: sem Stripe, apenas cancela e zera créditos ──────────────────
    if (isPix) {
      const brands = await prisma.brand.findMany({ where: { ownerId: userId }, select: { id: true } });
      const brandIds = brands.map(b => b.id);
      await prisma.release.deleteMany({ where: { brandId: { in: brandIds } } });
      await prisma.brandMember.deleteMany({ where: { brandId: { in: brandIds } } });
      await prisma.brand.deleteMany({ where: { ownerId: userId } });
      await prisma.subscription.update({
        where: { ownerId: userId },
        data: { status: "CANCELLED", creditsTotal: 0, creditsUsed: 0 },
      });
      if (email) await sendCancellationEmail(email, firstName, true, null, planLabel).catch(console.error);
      await createNotification(userId, "subscription_cancelled",
        "Assinatura cancelada",
        `Seu Plano ${planLabel} foi cancelado. Para reembolso via Pix, entre em contato pelo suporte.`,
        "/configuracoes?tab=cobranca",
      ).catch(console.error);
      return NextResponse.json({ ok: true, refunded: false, boletoRefund: false, periodEnd: null });
    }

    // ── Stripe: reembolso automático ──────────────────────────────────────
    const invoices = await stripe.invoices.list({ subscription: sub.stripeSubscriptionId!, limit: 1 });
    const lastInvoice = invoices.data[0] as unknown as { payment_intent?: string | null; charge?: string | null };

    // Resolve o payment_intent: pode estar direto na fatura ou via charge
    // (pagamentos via Checkout Session não populam payment_intent na fatura)
    let paymentIntentId: string | null = null;
    if (lastInvoice?.payment_intent && typeof lastInvoice.payment_intent === "string") {
      paymentIntentId = lastInvoice.payment_intent;
    } else if (lastInvoice?.charge && typeof lastInvoice.charge === "string") {
      try {
        const ch = await stripe.charges.retrieve(lastInvoice.charge);
        paymentIntentId = typeof ch.payment_intent === "string" ? ch.payment_intent : null;
      } catch { /* ignora */ }
    } else {
      // Fallback: busca o charge mais recente do cliente
      try {
        const stripeCustomerId = sub.stripeCustomerId as string | undefined;
        if (stripeCustomerId) {
          const charges = await stripe.charges.list({ customer: stripeCustomerId, limit: 1 });
          const ch = charges.data[0];
          if (ch && ch.paid && !ch.refunded) {
            paymentIntentId = typeof ch.payment_intent === "string" ? ch.payment_intent : null;
          }
        }
      } catch { /* ignora */ }
    }

    let isBoleto = false;
    if (paymentIntentId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
          expand: ["charges.data.payment_method_details"],
        });
        const pmType = (pi as { charges?: { data?: Array<{ payment_method_details?: { type?: string } }> } })
          .charges?.data?.[0]?.payment_method_details?.type;
        isBoleto = pmType === "boleto";
      } catch { /* assume card */ }
    }

    if (!isBoleto && paymentIntentId) {
      await stripe.refunds.create({ payment_intent: paymentIntentId });
    }
    await stripe.subscriptions.cancel(sub.stripeSubscriptionId!);

    const brands = await prisma.brand.findMany({ where: { ownerId: userId }, select: { id: true } });
    const brandIds = brands.map(b => b.id);
    await prisma.release.deleteMany({ where: { brandId: { in: brandIds } } });
    await prisma.brandMember.deleteMany({ where: { brandId: { in: brandIds } } });
    await prisma.brand.deleteMany({ where: { ownerId: userId } });
    await prisma.subscription.update({
      where: { ownerId: userId },
      data: { status: "CANCELLED", creditsTotal: 0, creditsUsed: 0 },
    });
    if (email) await sendCancellationEmail(email, firstName, true, null, planLabel).catch(console.error);
    if (isBoleto && pixKey) {
      await createNotification(userId, "subscription_cancelled",
        "Reembolso via PIX solicitado",
        `Chave PIX (${pixKeyType ?? "chave"}): ${pixKey}. O valor será transferido em até 5 dias úteis.`,
        "/configuracoes?tab=cobranca",
      ).catch(console.error);
    } else {
      await createNotification(userId, "subscription_cancelled",
        "Assinatura cancelada e reembolso processado",
        `Seu reembolso do Plano ${planLabel} foi processado. O valor será creditado em até 10 dias úteis.`,
        "/configuracoes?tab=cobranca",
      ).catch(console.error);
    }
    return NextResponse.json({ ok: true, refunded: !isBoleto, boletoRefund: isBoleto, periodEnd: null });

  } else {
    // ── Fora da janela de 7 dias: cancela ao fim do período ───────────────
    if (!isPix) {
      await stripe.subscriptions.update(sub.stripeSubscriptionId!, { cancel_at_period_end: true });
    }
    await prisma.subscription.update({
      where: { ownerId: userId },
      data: { status: "CANCELLED" },
    });
    if (email) await sendCancellationEmail(email, firstName, false, sub.currentPeriodEnd ?? null, planLabel).catch(console.error);
    const until = sub.currentPeriodEnd
      ? sub.currentPeriodEnd.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })
      : "o fim do ciclo";
    await createNotification(userId, "subscription_cancelled",
      "Assinatura cancelada",
      `Seu acesso ao Plano ${planLabel} permanece ativo até ${until}.`,
      "/configuracoes?tab=cobranca",
    ).catch(console.error);
    return NextResponse.json({ ok: true, refunded: false, periodEnd: sub.currentPeriodEnd?.toISOString() ?? null });
  }
}
