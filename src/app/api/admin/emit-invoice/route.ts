export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { assertMaster } from "@/lib/admin-server";
import { PLANS } from "@/lib/plans";
import { clerkClient } from "@clerk/nextjs/server";

const NFEIO_API_KEY  = process.env.NFEIO_API_KEY!;
const NFEIO_COMPANY  = process.env.NFEIO_COMPANY_ID ?? "796880a7bfb7407db2201ffee964b4ef";
const NFEIO_SVC_CODE = process.env.NFEIO_SERVICE_CODE ?? "2800";

// GET /api/admin/emit-invoice?nfeioId=XXX — busca nota pelo ID para inspecionar campos
export async function GET(req: NextRequest) {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const nfeioId = req.nextUrl.searchParams.get("nfeioId");
  if (!nfeioId)
    return NextResponse.json({ error: "nfeioId obrigatório" }, { status: 400 });

  const res = await fetch(`https://api.nfe.io/v1/companies/${NFEIO_COMPANY}/serviceinvoices/${nfeioId}`, {
    headers: { "Authorization": NFEIO_API_KEY },
  });

  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { ownerId, amountCents } = await req.json() as { ownerId: string; amountCents: number };
  if (!ownerId || !amountCents)
    return NextResponse.json({ error: "ownerId e amountCents obrigatórios" }, { status: 400 });

  const prisma = getPrisma();
  const clerk = await clerkClient();
  const [fiscal, sub, clerkUser] = await Promise.all([
    prisma.fiscalProfile.findUnique({ where: { ownerId } }),
    prisma.subscription.findUnique({ where: { ownerId }, select: { plan: true, creditsTotal: true } }),
    clerk.users.getUser(ownerId),
  ]);
  const borrowerEmail = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  if (!fiscal)
    return NextResponse.json({ error: "Perfil fiscal não encontrado" }, { status: 404 });

  const borrowerDoc = fiscal.personType === "PJ"
    ? fiscal.cnpj!.replace(/\D/g, "")
    : fiscal.cpf!.replace(/\D/g, "");

  // Busca código IBGE via ViaCEP para enviar à NFe.io
  let cityCode = "";
  try {
    const cepClean = fiscal.cep.replace(/\D/g, "");
    const viaCep = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`).then(r => r.json()) as { ibge?: string };
    cityCode = viaCep.ibge ?? "";
  } catch { /* usa só o nome se ViaCEP falhar */ }

  const amount = amountCents / 100;
  const planLabel = sub ? (PLANS[sub.plan as keyof typeof PLANS]?.label ?? sub.plan) : "—";
  const credits = sub?.creditsTotal ?? 0;
  const today = new Date().toLocaleDateString("pt-BR");
  const description = [
    "Raio Publicador",
    `Plano ${planLabel} ${credits} créditos`,
    `Acesso e uso de créditos confirmados em ${today}`,
  ].join("\n");

  const body = {
    cityServiceCode: NFEIO_SVC_CODE,
    description,
    servicesAmount: amount,
    pisAmountWithheld:    parseFloat((amount * 0.0065).toFixed(2)),
    cofinsAmountWithheld: parseFloat((amount * 0.03).toFixed(2)),
    csllAmountWithheld:   parseFloat((amount * 0.01).toFixed(2)),
    irAmountWithheld:     parseFloat((amount * 0.01).toFixed(2)),
    borrower: {
      federalTaxNumber: borrowerDoc,
      name: fiscal.personType === "PJ" ? fiscal.companyName! : fiscal.fullName!,
      email: borrowerEmail,
      address: {
        country: "BRA",
        postalCode: fiscal.cep.replace(/\D/g, ""),
        street: fiscal.street,
        number: fiscal.number,
        additionalInformation: fiscal.complement ?? "",
        district: fiscal.district,
        city: { name: fiscal.city, ...(cityCode && { code: cityCode }) },
        state: fiscal.state,
      },
    },
  };

  const res = await fetch(`https://api.nfe.io/v1/companies/${NFEIO_COMPANY}/serviceinvoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": NFEIO_API_KEY },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `NFe.io ${res.status}: ${text}` }, { status: 502 });
  }

  const data = await res.json() as { id?: string };
  return NextResponse.json({ ok: true, nfeioId: data.id });
}
