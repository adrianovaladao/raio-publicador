export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
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

  const profile = await getPrisma().fiscalProfile.upsert({
    where: { ownerId: userId },
    update: { ...body },
    create: { ownerId: userId, ...body },
  });

  return NextResponse.json(profile);
}
