export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = await getPrisma().fiscalProfile.findUnique({ where: { ownerId: userId } });
  return NextResponse.json(profile ?? null);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    personType: "PF" | "PJ";
    fullName?: string;
    cpf?: string;
    companyName?: string;
    cnpj?: string;
    cep: string;
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
  };

  // Validação mínima
  if (!body.personType || !body.cep || !body.street || !body.number || !body.district || !body.city || !body.state) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }
  if (body.personType === "PF" && (!body.fullName || !body.cpf)) {
    return NextResponse.json({ error: "Nome completo e CPF são obrigatórios para pessoa física." }, { status: 400 });
  }
  if (body.personType === "PJ" && (!body.companyName || !body.cnpj)) {
    return NextResponse.json({ error: "Razão social e CNPJ são obrigatórios para pessoa jurídica." }, { status: 400 });
  }

  const prisma = getPrisma();

  // Salva/atualiza perfil fiscal
  const profile = await prisma.fiscalProfile.upsert({
    where: { ownerId: userId },
    update: { ...body },
    create: { ownerId: userId, ...body },
  });

  // Sincroniza dados fiscais no Customer do Stripe (para NFe.io)
  try {
    const sub = await prisma.subscription.findUnique({
      where: { ownerId: userId },
      select: { stripeCustomerId: true },
    });

    if (sub?.stripeCustomerId) {
      const stripe = getStripe();
      const customerId = sub.stripeCustomerId;

      const name = body.personType === "PF" ? (body.fullName ?? "") : (body.companyName ?? "");
      const taxNumber = body.personType === "PF"
        ? (body.cpf ?? "").replace(/\D/g, "")
        : (body.cnpj ?? "").replace(/\D/g, "");

      // Atualiza nome e endereço no Customer
      await stripe.customers.update(customerId, {
        name,
        address: {
          line1: `${body.street}, ${body.number}${body.complement ? `, ${body.complement}` : ""}`,
          line2: body.district,
          city: body.city,
          state: body.state,
          postal_code: body.cep.replace(/\D/g, ""),
          country: "BR",
        },
      });

      // Adiciona/substitui o Tax ID (CPF ou CNPJ) no Customer
      // Remove tax IDs anteriores para não duplicar
      const existingTaxIds = await stripe.customers.listTaxIds(customerId);
      for (const tid of existingTaxIds.data) {
        await stripe.customers.deleteTaxId(customerId, tid.id).catch(() => {});
      }
      // br_cpf para pessoa física, br_cnpj para pessoa jurídica
      const taxType = body.personType === "PF" ? "br_cpf" : "br_cnpj";
      if (taxNumber) {
        await stripe.customers.createTaxId(customerId, { type: taxType as "br_cpf" | "br_cnpj", value: taxNumber });
      }
    }
  } catch (e) {
    // Não bloqueia o fluxo — loga mas continua
    console.error("[fiscal-profile] Erro ao sincronizar Customer Stripe:", e);
  }

  return NextResponse.json(profile);
}
