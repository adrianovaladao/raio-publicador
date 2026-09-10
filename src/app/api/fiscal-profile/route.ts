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

  // Salva no banco
  const profile = await prisma.fiscalProfile.upsert({
    where: { ownerId: userId },
    update: { ...body },
    create: { ownerId: userId, ...body },
  });

  // Sincroniza com o Stripe — só se o customer já existir (pós-pagamento)
  // Sem FiscalProfile no momento do checkout, a sincronização acontece aqui.
  try {
    const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });
    const customerId = sub?.stripeCustomerId;
    if (customerId) {
      const stripe = getStripe();
      const name = body.personType === "PF"
        ? (body.fullName ?? "")
        : (body.companyName ?? "");
      const taxNumber = body.personType === "PF"
        ? (body.cpf ?? "").replace(/\D/g, "")
        : (body.cnpj ?? "").replace(/\D/g, "");
      const taxType = body.personType === "PF" ? "br_cpf" : "br_cnpj";

      await stripe.customers.update(customerId, {
        name,
        address: {
          line1: `${body.street}, ${body.number}`,
          line2: body.district,
          city: body.city,
          state: body.state,
          postal_code: body.cep.replace(/\D/g, ""),
          country: "BR",
        },
        // NFe.io lê borrowerFederalTaxNumber do metadata (não dos tax_ids nativos)
        metadata: {
          borrowerFederalTaxNumber: taxNumber,
          borrowerName: name,
        },
      });

      if (taxNumber) {
        const existingTaxIds = await stripe.customers.listTaxIds(customerId);
        await Promise.all(
          existingTaxIds.data.map(tid => stripe.customers.deleteTaxId(customerId, tid.id))
        );
        await stripe.customers.createTaxId(customerId, {
          type: taxType as "br_cpf" | "br_cnpj",
          value: taxNumber,
        });
      }
    }
  } catch (err) {
    // Sync com Stripe é best-effort — não bloqueia a resposta
    console.error("[fiscal-profile] Stripe sync error:", err);
  }

  return NextResponse.json(profile);
}
