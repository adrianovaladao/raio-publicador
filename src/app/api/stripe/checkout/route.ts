export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { PLANS, type PlanId } from "@/lib/plans";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, rateLimiters, getIp } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(rateLimiters.checkout, getIp(req));
  if (limited) return limited;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = (await req.json()) as { planId: PlanId };
  const plan = PLANS[planId];
  if (!plan) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  const stripe = getStripe();
  const prisma = getPrisma();

  const [sub, fiscalProfile] = await Promise.all([
    prisma.subscription.findUnique({ where: { ownerId: userId } }),
    prisma.fiscalProfile.findUnique({ where: { ownerId: userId } }),
  ]);

  // Dados fiscais são obrigatórios para emissão de NF
  if (!fiscalProfile) {
    return NextResponse.json(
      { error: "Preencha os dados para nota fiscal antes de continuar." },
      { status: 400 }
    );
  }

  // Cria ou recupera o Customer no Stripe
  let customerId = sub?.stripeCustomerId ?? undefined;
  if (!customerId) {
    const existing = await stripe.customers.list({ email, limit: 100 });
    const match = existing.data.find(c => c.metadata?.clerkId === userId);
    customerId = match?.id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email, metadata: { clerkId: userId } });
      customerId = customer.id;
    }
    if (sub) {
      await prisma.subscription.update({ where: { ownerId: userId }, data: { stripeCustomerId: customerId } });
    }
  }

  // Monta dados fiscais
  const name = fiscalProfile.personType === "PF"
    ? (fiscalProfile.fullName ?? "")
    : (fiscalProfile.companyName ?? "");

  const taxNumber = fiscalProfile.personType === "PF"
    ? (fiscalProfile.cpf ?? "").replace(/\D/g, "")
    : (fiscalProfile.cnpj ?? "").replace(/\D/g, "");

  const taxType = fiscalProfile.personType === "PF" ? "br_cpf" : "br_cnpj";

  // Sincroniza nome e endereço no Customer — obrigatório, sem silenciar erros
  await stripe.customers.update(customerId, {
    name,
    address: {
      // line1 = Logradouro (apenas rua + número, sem complemento — NFe.io usa como campo Logradouro, que tem maxLength ~50)
      // line2 = Bairro (NFe.io mapeia para o campo Bairro da NFS-e)
      line1: `${fiscalProfile.street}, ${fiscalProfile.number}`,
      line2: fiscalProfile.district,
      city: fiscalProfile.city,
      state: fiscalProfile.state,
      postal_code: fiscalProfile.cep.replace(/\D/g, ""),
      country: "BR",
    },
  });

  // Sincroniza CPF/CNPJ — remove anteriores e adiciona o atual
  if (taxNumber) {
    const existingTaxIds = await stripe.customers.listTaxIds(customerId);
    await Promise.all(
      existingTaxIds.data.map(tid => stripe.customers.deleteTaxId(customerId!, tid.id))
    );
    await stripe.customers.createTaxId(customerId, { type: taxType as "br_cpf" | "br_cnpj", value: taxNumber });
  }

  const origin = req.nextUrl.origin;
  const cardFeeCents = Math.round(plan.priceCents * 0.035);
  const planFeatures: Record<string, string> = {
    BASIC:        "200 créditos/mês · 2 marcas · 1 editor · 1 revisor · 2 pub. Cat. A/mês",
    ADVANCED:     "1.000 créditos/mês · 5 marcas · 3 editores · 5 revisores · 5 pub. Cat. A/mês",
    PROFESSIONAL: "2.000 créditos/mês · 10 marcas · 5 editores · 10 revisores · 10 pub. Cat. A/mês",
  };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    currency: "brl",
    payment_method_types: ["card"],
    billing_address_collection: "required",
    line_items: [
      { price: plan.stripePriceId, quantity: 1 },
      {
        price_data: {
          currency: "brl",
          unit_amount: cardFeeCents,
          recurring: { interval: "month" },
          product_data: {
            name: "Taxa de processamento (cartão/boleto 3,5%)",
            description: "Aplicada mensalmente sobre o valor do plano.",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/boas-vindas?checkout=success`,
    cancel_url: `${origin}/site#planos`,
    locale: "pt-BR",
    metadata: { clerkId: userId, planId },
    subscription_data: { metadata: { clerkId: userId, planId } },
    custom_text: {
      submit: { message: `Plano ${plan.label}: ${planFeatures[planId] ?? ""}` },
    },
  });

  if (!sub) {
    await prisma.subscription.create({
      data: { ownerId: userId, plan: planId, status: "INACTIVE", creditsTotal: 0, stripeCustomerId: customerId },
    });
  }

  return NextResponse.json({ url: session.url });
}
