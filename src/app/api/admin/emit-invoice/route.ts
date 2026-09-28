export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { assertMaster } from "@/lib/admin-server";

const NFEIO_API_KEY  = process.env.NFEIO_API_KEY!;
const NFEIO_COMPANY  = process.env.NFEIO_COMPANY_ID!;
const NFEIO_SVC_CODE = process.env.NFEIO_SERVICE_CODE ?? "2800";

export async function POST(req: NextRequest) {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { ownerId, amountCents } = await req.json() as { ownerId: string; amountCents: number };
  if (!ownerId || !amountCents)
    return NextResponse.json({ error: "ownerId e amountCents obrigatórios" }, { status: 400 });

  const prisma = getPrisma();
  const fiscal = await prisma.fiscalProfile.findUnique({ where: { ownerId } });
  if (!fiscal)
    return NextResponse.json({ error: "Perfil fiscal não encontrado" }, { status: 404 });

  console.log("[emit-invoice] fiscal:", JSON.stringify({ city: fiscal.city, state: fiscal.state, district: fiscal.district, cep: fiscal.cep }));

  const borrowerDoc = fiscal.personType === "PJ"
    ? fiscal.cnpj!.replace(/\D/g, "")
    : fiscal.cpf!.replace(/\D/g, "");

  const body = {
    cityServiceCode: NFEIO_SVC_CODE,
    description: "Prestacao de servicos de tecnologia de informacao - Plataforma Raio Publicador",
    servicesAmount: amountCents / 100,
    borrower: {
      federalTaxNumber: borrowerDoc,
      name: fiscal.personType === "PJ" ? fiscal.companyName! : fiscal.fullName!,
      address: {
        country: "BRA",
        postalCode: fiscal.cep.replace(/\D/g, ""),
        street: fiscal.street,
        number: fiscal.number,
        additionalInformation: fiscal.complement ?? "",
        district: fiscal.district,
        city: { name: fiscal.city },
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
    return NextResponse.json({ error: `NFe.io ${res.status}: ${text}`, debug: { city: fiscal.city, state: fiscal.state, cep: fiscal.cep, district: fiscal.district, bodySent: body } }, { status: 502 });
  }

  const data = await res.json() as { id?: string };
  return NextResponse.json({ ok: true, nfeioId: data.id });
}
