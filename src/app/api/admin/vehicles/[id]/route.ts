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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertRaioAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name, domain, category, tier, reach, logoUrl } = await req.json();

  try {
    const vehicle = await getPrisma().vehicle.update({
      where: { id },
      data: { name, domain, category, tier, reach: Number(reach), logoUrl: logoUrl ?? null },
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
