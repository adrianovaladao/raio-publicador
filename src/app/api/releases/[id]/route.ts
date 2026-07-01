export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const release = await getPrisma().release.findUnique({
    where: { id },
    include: { brand: true },
  });
  if (!release) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(release);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const prisma = getPrisma();
  const prev = await prisma.release.findUnique({ where: { id }, select: { status: true } });
  const release = await prisma.release.update({ where: { id }, data: body });
  const becomingScheduled = body.status === "SCHEDULED" && prev?.status !== "SCHEDULED";
  if (becomingScheduled && body.creditsUsed > 0) {
    await prisma.subscription.updateMany({
      where: { ownerId: userId },
      data: { creditsUsed: { increment: body.creditsUsed } },
    });
  }
  return NextResponse.json(release);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await getPrisma().release.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
