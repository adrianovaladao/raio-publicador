export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { assertMaster } from "@/lib/admin-server";
import { PLANS } from "@/lib/plans";

const NFEIO_API_KEY  = process.env.NFEIO_API_KEY!;
const NFEIO_COMPANY  = process.env.NFEIO_COMPANY_ID ?? "796880a7bfb7407db2201ffee964b4ef";
const NFEIO_SVC_CODE = process.env.NFEIO_SERVICE_CODE ?? "2800";

export async function GET() {
  try {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prisma = getPrisma();
  const invoices = await prisma.pendingInvoice.findMany({
    orderBy: { scheduledFor: "desc" },
  });

  const clerkIds = [...new Set(invoices.map(i => i.clerkId))];
  const clerk = await clerkClient();
  const clerkUsers = await clerk.users.getUserList({ limit: 500 });
  const clerkMap = new Map(
    clerkUsers.data.filter(u => clerkIds.includes(u.id)).map(u => [u.id, u])
  );

  const fiscalProfiles = clerkIds.length > 0
    ? await prisma.fiscalProfile.findMany({ where: { ownerId: { in: clerkIds } } })
    : [];
  const fiscalMap = new Map(fiscalProfiles.map(f => [f.ownerId, f]));

  const rows = invoices.map(inv => {
    const cu = clerkMap.get(inv.clerkId);
    const fp = fiscalMap.get(inv.clerkId);
    return {
      id:              inv.id,
      clerkId:         inv.clerkId,
      name:            [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") || "—",
      email:           cu?.emailAddresses[0]?.emailAddress ?? "—",
      amountCents:     inv.amountCents,
      scheduledFor:    inv.scheduledFor.toISOString(),
      status:          inv.status,
      nfeioId:         inv.nfeioId ?? null,
      errorMessage:    inv.errorMessage ?? null,
      hasFiscalProfile: !!fp,
      stripeInvoiceId: inv.stripeInvoiceId ?? null,
      pixPaymentId:    inv.pixPaymentId ?? null,
    };
  });

  return NextResponse.json({ invoices: rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[GET /api/admin/nfse]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { invoiceId } = await req.json() as { invoiceId: string };
  if (!invoiceId)
    return NextResponse.json({ error: "invoiceId obrigatório" }, { status: 400 });

  const prisma = getPrisma();
  const inv = await prisma.pendingInvoice.findUnique({ where: { id: invoiceId } });
  if (!inv)
    return NextResponse.json({ error: "Invoice não encontrada" }, { status: 404 });

  const clerk = await clerkClient();
  const [fiscal, sub, clerkUser] = await Promise.all([
    prisma.fiscalProfile.findUnique({ where: { ownerId: inv.clerkId } }),
    prisma.subscription.findUnique({ where: { ownerId: inv.clerkId }, select: { plan: true, creditsTotal: true } }),
    clerk.users.getUser(inv.clerkId),
  ]);

  if (!fiscal) {
    await prisma.pendingInvoice.update({
      where: { id: inv.id },
      data: { status: "NO_FISCAL_PROFILE", errorMessage: "FiscalProfile não encontrado" },
    });
    return NextResponse.json({ error: "Perfil fiscal não encontrado" }, { status: 422 });
  }

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

  const amount = inv.amountCents / 100;
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

  return NextResponse.json({ ok: true, nfeioId: data.id });
}
