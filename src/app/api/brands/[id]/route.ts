export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await req.json();
    const brand = await getPrisma().brand.update({ where: { id, ownerId: userId }, data: body });
    return NextResponse.json(brand);
  } catch (e) {
    console.error("[PUT /api/brands/:id]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    await getPrisma().brand.delete({ where: { id, ownerId: userId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/brands/:id]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
