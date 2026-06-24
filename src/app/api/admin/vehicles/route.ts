export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function assertRaioAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return user?.publicMetadata?.raioAdmin === true;
}

export async function GET() {
  if (!await assertRaioAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const vehicles = await getPrisma().vehicle.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(vehicles);
}

export async function POST(req: Request) {
  if (!await assertRaioAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, domain, category, tier, reach, logoUrl } = await req.json();
  if (!name || !domain || !category || !tier || reach == null)
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });

  try {
    const vehicle = await getPrisma().vehicle.create({
      data: { name, domain, category, tier, reach: Number(reach), logoUrl: logoUrl ?? null },
    });
    return NextResponse.json(vehicle, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Domínio já cadastrado" }, { status: 409 });
  }
}
