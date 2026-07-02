export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ReleaseStatus } from "@prisma/client";

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
  const body = await req.json() as { status: string; creditsUsed: number; title?: string; body?: string; summary?: string; scheduledAt?: string | null; brandId?: string; imageUrl?: string | null; vehicles?: string[] };
  const prisma = getPrisma();
  const prev = await prisma.release.findUnique({ where: { id }, select: { status: true } });
  const becomingScheduled = body.status === "SCHEDULED" && prev?.status !== "SCHEDULED";
  const updateData = {
    ...(body.title       !== undefined && { title:       body.title }),
    ...(body.body        !== undefined && { body:        body.body }),
    ...(body.summary     !== undefined && { summary:     body.summary }),
    ...(body.imageUrl    !== undefined && { imageUrl:    body.imageUrl }),
    ...(body.vehicles    !== undefined && { vehicles:    body.vehicles }),
    ...(body.brandId     !== undefined && { brandId:     body.brandId }),
    ...(body.scheduledAt !== undefined && { scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null }),
    ...(body.creditsUsed !== undefined && { creditsUsed: body.creditsUsed }),
    ...(body.status      !== undefined && { status:      body.status as ReleaseStatus }),
  };

  const creditsToDebit = becomingScheduled ? (body.creditsUsed ?? 0) : 0;

  const [release] = await prisma.$transaction([
    prisma.release.update({ where: { id }, data: updateData }),
    ...(creditsToDebit > 0
      ? [prisma.subscription.update({
          where: { ownerId: userId },
          data: { creditsUsed: { increment: creditsToDebit } },
        })]
      : []),
  ]);

  return NextResponse.json(release);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await getPrisma().release.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
