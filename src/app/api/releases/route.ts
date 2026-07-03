export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ReleaseStatus } from "@prisma/client";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const releases = await getPrisma().release.findMany({
    where: { brand: { ownerId: userId } },
    include: { brand: { select: { name: true, color: true, logoUrl: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(releases);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as { status: string; creditsUsed: number; title: string; body: string; summary?: string; scheduledAt?: string | null; brandId: string; imageUrl?: string | null; vehicles: string[] };
  console.log("[releases POST] status:", body.status, "creditsUsed:", body.creditsUsed, "vehicles:", body.vehicles?.length);
  const prisma = getPrisma();

  if (body.status === "SCHEDULED") {
    const sub = await prisma.subscription.findUnique({ where: { ownerId: userId }, select: { status: true } });
    if (!sub || ["PAST_DUE", "CANCELLED", "INACTIVE"].includes(sub.status)) {
      return NextResponse.json({ error: "Assinatura inativa. Regularize seu plano para agendar releases." }, { status: 403 });
    }
  }

  const creditsToDebit = body.status === "SCHEDULED" ? (body.creditsUsed ?? 0) : 0;

  const [release] = await prisma.$transaction([
    prisma.release.create({
      data: {
        title:       body.title,
        body:        body.body,
        summary:     body.summary,
        status:      body.status as ReleaseStatus,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        brandId:     body.brandId,
        imageUrl:    body.imageUrl,
        vehicles:    body.vehicles,
        creditsUsed: body.creditsUsed,
        authorId:    userId,
      },
    }),
    ...(creditsToDebit > 0
      ? [prisma.subscription.update({
          where: { ownerId: userId },
          data: { creditsUsed: { increment: creditsToDebit } },
        })]
      : []),
  ]);

  return NextResponse.json(release, { status: 201 });
}
