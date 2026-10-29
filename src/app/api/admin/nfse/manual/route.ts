export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { assertMaster } from "@/lib/admin-server";
import { PLANS } from "@/lib/plans";

const NFEIO_API_KEY  = process.env.NFEIO_API_KEY!;
const NFEIO_COMPANY  = process.env.NFEIO_COMPANY_ID ?? "796880a7bfb7407db2201ffee964b4ef";
const NFEIO_SVC_CODE = process.env.NFEIO_SERVICE_CODE ?? "2800";

/**
 * POST /api/admin/nfse/manual
 *
 * Cria um PendingInvoice manualmente e emite a NFS-e imediatamente.
 * Usado para compras que ocorreram antes do fix de geração automática.
 *
 * Body: { clerkId: string; amountCents: number; description?: string }
 */
export async function POST(req: NextRequest) {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { clerkId, amountCents, description: customDescription } =
    await req.json() as { clerkId: string; amountCents: number; description?: string };

  if (!clerkId || !amountCents || amountCents <= 0)
    return NextResponse.json({ error: "clerkId e amountCents obrigatórios" }, { status: 400 });

  const prisma = getPrisma();
  const clerk = await clerkClient();

  const [fiscal, sub, clerkUser] = await Promise.all([
    prisma.fiscalProfile.findUnique({ where: { ownerId: clerkId } }),
    prisma.subscription.findUnique({ where: { ownerId: clerkId }, select: { plan: true, creditsTotal: true } }),
    clerk.users.getUser(clerkId),
  ]);

  if (!fiscal)
    return NextResponse.json({ error: "Perfil fiscal não encontrado para este usuário" }, { status: 422 });

  // Cria o PendingInvoice sem stripeInvoiceId (compra manual)
  const inv = await prisma.pendingInvoice.create({
    data: {
      clerkId,
      amountCents,
      scheduledFor: new Date(),
      status: "PENDING",
    },
  });

  const borrowerEmail = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const borrowerDoc = fiscal.personType === "PJ"
    ? fiscal.cnpj!.replace(/\D/g, "")
    : fiscal.cpf!.replace(/\D/g, "");

  let cityCode = "";
  try {
    const cepClean = fiscal.cep.replace(/\D/g, "");
    const viaCep = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`).then(r => r.json()) as { ibge?: string };
    cityCode = viaCep.ibge ?? "";
  } catch { /* usa só o nome */ }

  const amount = amountCents / 100;
  const planLabel = sub ? (PLANS[sub.plan as keyof typeof PLANS]?.label ?? sub.plan) : "—";
  const credits = sub?.creditsTotal ?? 0;
  const today = new Date().toLocaleDateString("pt-BR");
  const description = customDescription ?? [
    "PRESTACAO DE SERVICOS DE TECNOLOGIA DE INFORMACAO - PLATAFORMA RAIO PUBLICADOR",
    `PLANO ${planLabel.toUpperCase()}`,
    `CREDITOS AVULSOS ${credits}`,
    `ACESSO E USO DE CREDITOS CONFIRMADOS EM ${today}`,
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
    await prisma.pendingInvoice.update({
      where: { id: inv.id },
      data: { status: "FAILED", errorMessage: `NFe.io ${res.status}: ${text}` },
    });
    return NextResponse.json({ error: `NFe.io ${res.status}: ${text}` }, { status: 502 });
  }

  const data = await res.json() as { id?: string };
  await prisma.pendingInvoice.update({
    where: { id: inv.id },
    data: { status: "SENT", nfeioId: data.id ?? null, errorMessage: null },
  });

  return NextResponse.json({ ok: true, pendingInvoiceId: inv.id, nfeioId: data.id });
}
