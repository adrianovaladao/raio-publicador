export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const NFEIO_API_KEY   = process.env.NFEIO_API_KEY!;
const NFEIO_COMPANY   = process.env.NFEIO_COMPANY_ID!;
const NFEIO_SVC_CODE  = process.env.NFEIO_SERVICE_CODE ?? "2800";
const NFEIO_BASE      = "https://api.nfe.io";

async function emitNFSe(amountCents: number, fiscal: {
  personType: string; fullName?: string | null; cpf?: string | null;
  companyName?: string | null; cnpj?: string | null;
  street: string; number: string; complement?: string | null;
  district: string; city: string; state: string; cep: string;
}) {
  const borrowerDoc = fiscal.personType === "PJ"
    ? { type: "J", number: fiscal.cnpj!.replace(/\D/g, "") }
    : { type: "F", number: fiscal.cpf!.replace(/\D/g, "") };

  let cityCode = "";
  try {
    const cepClean = fiscal.cep.replace(/\D/g, "");
    const viaCep = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`).then(r => r.json()) as { ibge?: string };
    cityCode = viaCep.ibge ?? "";
  } catch { /* usa só o nome se ViaCEP falhar */ }

  const amount = amountCents / 100;
  const body = {
    cityServiceCode: NFEIO_SVC_CODE,
    description: "Prestacao de servicos de tecnologia de informacao - Plataforma Raio Publicador",
    servicesAmount: amount,
    pisAmountWithheld:    parseFloat((amount * 0.0065).toFixed(2)),
    cofinsAmountWithheld: parseFloat((amount * 0.03).toFixed(2)),
    csllAmountWithheld:   parseFloat((amount * 0.01).toFixed(2)),
    irAmountWithheld:     parseFloat((amount * 0.01).toFixed(2)),
    borrower: {
      federalTaxNumber: borrowerDoc.number,
      name: fiscal.personType === "PJ" ? fiscal.companyName! : fiscal.fullName!,
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

  const res = await fetch(`${NFEIO_BASE}/v1/companies/${NFEIO_COMPANY}/serviceinvoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": NFEIO_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NFe.io ${res.status}: ${text}`);
  }

  const data = await res.json() as { id?: string };
  return data.id;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const now = new Date();

  const pending = await prisma.pendingInvoice.findMany({
    where: { status: "PENDING", scheduledFor: { lte: now } },
  });

  const results = { emitted: 0, noProfile: 0, failed: 0 };

  for (const inv of pending) {
    const fiscal = await prisma.fiscalProfile.findUnique({ where: { ownerId: inv.clerkId } });

    if (!fiscal) {
      await prisma.pendingInvoice.update({
        where: { id: inv.id },
        data: { status: "NO_FISCAL_PROFILE", errorMessage: "FiscalProfile não encontrado" },
      });
      results.noProfile++;
      continue;
    }

    try {
      const nfeioId = await emitNFSe(inv.amountCents, fiscal);
      await prisma.pendingInvoice.update({
        where: { id: inv.id },
        data: { status: "SENT", nfeioId },
      });
      results.emitted++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await prisma.pendingInvoice.update({
        where: { id: inv.id },
        data: { status: "FAILED", errorMessage: msg },
      });
      console.error(`[cron/emit-invoices] Falha ao emitir ${inv.id}:`, msg);
      results.failed++;
    }
  }

  console.log("[cron/emit-invoices]", results);
  return NextResponse.json(results);
}
