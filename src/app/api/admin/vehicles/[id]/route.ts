export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isAnyAdmin } from "@/lib/admin";

async function assertRaioAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return isAnyAdmin(user?.publicMetadata as Record<string, unknown>);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertRaioAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name, domain, site, location, category, tier, reach, logoUrl } = await req.json();

  try {
    const vehicle = await getPrisma().vehicle.update({
      where: { id },
      data: { name, domain, site: site ?? null, location: location ?? null, category, tier, reach: Number(reach), logoUrl: logoUrl ?? null },
    });
    return NextResponse.json(vehicle);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertRaioAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await getPrisma().vehicle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
