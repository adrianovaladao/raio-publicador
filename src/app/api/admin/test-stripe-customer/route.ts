export const dynamic = "force-dynamic";
import { getStripe } from "@/lib/stripe";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Rota temporária de diagnóstico — remover após teste
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.PROVISION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get("email") ?? "cleannowacar@gmail.com";
  const stripe = getStripe();
  const prisma = getPrisma();

  const customers = await stripe.customers.list({ email, limit: 5 });
  if (customers.data.length === 0) {
    return NextResponse.json({ found: false, email });
  }

  const results = await Promise.all(customers.data.map(async c => {
    const taxIds = await stripe.customers.listTaxIds(c.id);
    return {
      id: c.id,
      email: c.email,
      name: c.name,
      address: c.address,
      taxIds: taxIds.data.map(t => ({ type: t.type, value: t.value })),
    };
  }));

  return NextResponse.json({ found: true, customers: results });
}

// POST: força sync do FiscalProfile → Stripe para um clerkId específico
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.PROVISION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clerkId } = await req.json() as { clerkId: string };
  const stripe = getStripe();
  const prisma = getPrisma();

  const [sub, fiscalProfile] = await Promise.all([
    prisma.subscription.findUnique({ where: { ownerId: clerkId }, select: { stripeCustomerId: true } }),
    prisma.fiscalProfile.findUnique({ where: { ownerId: clerkId } }),
  ]);

  if (!sub?.stripeCustomerId) return NextResponse.json({ error: "Customer Stripe não encontrado para este clerkId" }, { status: 404 });
  if (!fiscalProfile) return NextResponse.json({ error: "FiscalProfile não encontrado para este clerkId" }, { status: 404 });

  const customerId = sub.stripeCustomerId;
  const name = fiscalProfile.personType === "PF" ? (fiscalProfile.fullName ?? "") : (fiscalProfile.companyName ?? "");
  const taxNumber = fiscalProfile.personType === "PF"
    ? (fiscalProfile.cpf ?? "").replace(/\D/g, "")
    : (fiscalProfile.cnpj ?? "").replace(/\D/g, "");

  await stripe.customers.update(customerId, {
    name,
    address: {
      line1: `${fiscalProfile.street}, ${fiscalProfile.number}${fiscalProfile.complement ? `, ${fiscalProfile.complement}` : ""}`,
      line2: fiscalProfile.district,
      city: fiscalProfile.city,
      state: fiscalProfile.state,
      postal_code: fiscalProfile.cep.replace(/\D/g, ""),
      country: "BR",
    },
  });

  const existingTaxIds = await stripe.customers.listTaxIds(customerId);
  for (const tid of existingTaxIds.data) {
    await stripe.customers.deleteTaxId(customerId, tid.id).catch(() => {});
  }
  if (taxNumber) {
    const taxType = fiscalProfile.personType === "PF" ? "br_cpf" : "br_cnpj";
    await stripe.customers.createTaxId(customerId, { type: taxType as "br_cpf" | "br_cnpj", value: taxNumber });
  }

  // Verifica resultado
  const updated = await stripe.customers.retrieve(customerId);
  const taxIds = await stripe.customers.listTaxIds(customerId);
  return NextResponse.json({
    ok: true,
    customerId,
    name: (updated as { name?: string | null }).name,
    address: (updated as { address?: unknown }).address,
    taxIds: taxIds.data.map(t => ({ type: t.type, value: t.value })),
  });
}
