export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { getPrisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";
import { NextRequest, NextResponse } from "next/server";

// Price per credit in cents per plan
const CREDIT_PRICE_CENTS: Record<string, number> = {
  BASIC:        500,  // R$5,00/cr
  ADVANCED:     300,  // R$3,00/cr
  PROFESSIONAL: 250,  // R$2,50/cr
  VOUCHER:      500,  // R$5,00/cr (mesmo que BASIC)
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { quantity, returnUrl } = (await req.json()) as { quantity: number; returnUrl?: string };
    if (!quantity || quantity < 1) return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });

    const prisma = getPrisma();
    const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });
    if (!sub) return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 });

    const plan = sub.plan as string;
    const pricePerCr = CREDIT_PRICE_CENTS[plan];
    if (!pricePerCr) return NextResponse.json({ error: "Plano sem pacote de créditos avulsos" }, { status: 400 });

    const totalCents = pricePerCr * quantity;
    const stripe = getStripe();

    let customerId = sub.stripeCustomerId ?? undefined;
    if (!customerId) {
      const user = await currentUser();
      const email = user?.emailAddresses[0]?.emailAddress;
      const customer = await stripe.customers.create({ email, metadata: { clerkId: userId } });
      customerId = customer.id;
      await prisma.subscription.update({ where: { ownerId: userId }, data: { stripeCustomerId: customerId } });
    }

    const origin = req.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      currency: "brl",
      line_items: [{
        price_data: {
          currency: "brl",
          unit_amount: totalCents,
          product_data: {
            name: `${quantity.toLocaleString("pt-BR")} créditos avulsos`,
            description: `Pacote de ${quantity} créditos para o plano ${PLANS[plan as keyof typeof PLANS]?.label ?? plan}`,
          },
        },
        quantity: 1,
      }],
      success_url: returnUrl ? `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}credits=success` : `${origin}/configuracoes?credits=success`,
      cancel_url: returnUrl ?? `${origin}/configuracoes`,
      locale: "pt-BR",
      metadata: { clerkId: userId, creditQty: String(quantity), type: "credit_purchase" },
      // Copia metadata para o PaymentIntent/Charge para que apareça no extrato e cobrança
      payment_intent_data: {
        metadata: { clerkId: userId, creditQty: String(quantity), type: "credit_purchase" },
      },
    });

    if (!session.url) return NextResponse.json({ error: "Erro ao criar sessão de pagamento" }, { status: 500 });

    return NextResponse.json({ redirect: true, url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("[stripe/credits]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
