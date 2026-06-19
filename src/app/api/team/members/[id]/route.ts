export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as { role?: string; status?: string };

  const data: Record<string, string> = {};
  if (body.role)   data.role   = body.role.toUpperCase();
  if (body.status) data.status = body.status.toUpperCase();

  const member = await getPrisma().teamMember.updateMany({
    where: { id, ownerId: userId },
    data,
  });

  if (member.count === 0) return NextResponse.json({ error: "Membro não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await getPrisma().teamMember.deleteMany({ where: { id, ownerId: userId } });
  return NextResponse.json({ ok: true });
}
