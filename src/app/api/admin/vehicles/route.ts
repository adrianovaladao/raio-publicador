export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isAnyAdmin } from "@/lib/admin";
import { createNotification } from "@/lib/notify";

async function assertRaioAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return isAnyAdmin(user?.publicMetadata as Record<string, unknown>);
}

export async function GET() {
  if (!await assertRaioAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const vehicles = await getPrisma().vehicle.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(vehicles);
}

export async function DELETE(req: Request) {
  if (!await assertRaioAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { ids } = await req.json() as { ids: string[] };
  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "ids obrigatório" }, { status: 400 });

  const { count } = await getPrisma().vehicle.deleteMany({ where: { id: { in: ids } } });
  return NextResponse.json({ deleted: count });
}

export async function POST(req: Request) {
  if (!await assertRaioAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, domain, site, location, category, tier, reach, logoUrl } = await req.json();
  if (!name || !domain || !category || !tier || reach == null)
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });

  try {
    const prisma = getPrisma();
    const vehicle = await prisma.vehicle.create({
      data: { name, domain, site: site ?? null, location: location ?? null, category, tier, reach: Number(reach), logoUrl: logoUrl ?? null },
    });

    // Notify all active subscription owners
    const subs = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      select: { ownerId: true },
    });
    await Promise.allSettled(subs.map(s =>
      createNotification(s.ownerId, "vehicle_added",
        "Novo veículo disponível",
        `${name} (${category} · Tier ${tier}) foi adicionado à plataforma.`,
        "/veiculos",
      )
    ));

    return NextResponse.json(vehicle, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Domínio já cadastrado" }, { status: 409 });
  }
}
