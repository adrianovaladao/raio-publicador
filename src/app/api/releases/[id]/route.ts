export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ReleaseStatus } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";
import { sendAdminNewReleaseEmail } from "@/lib/email";

const EDIT_LOCKED_STATUSES: ReleaseStatus[] = ["IN_REVIEW", "IN_PUBLICATION", "PUBLISHED"];

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
  const prev = await prisma.release.findUnique({ where: { id }, select: { status: true, creditsUsed: true, title: true, scheduledAt: true, vehicles: true } });

  // Block edits when release is in admin hands or already published
  if (prev && EDIT_LOCKED_STATUSES.includes(prev.status as ReleaseStatus)) {
    return NextResponse.json({ error: "Este release não pode ser editado no status atual." }, { status: 403 });
  }

  const becomingScheduled   = body.status === "SCHEDULED" && prev?.status !== "SCHEDULED";

  if (becomingScheduled) {
    const sub = await prisma.subscription.findUnique({ where: { ownerId: userId }, select: { status: true } });
    if (!sub || ["PAST_DUE", "CANCELLED", "INACTIVE"].includes(sub.status)) {
      return NextResponse.json({ error: "Assinatura inativa. Regularize seu plano para agendar releases." }, { status: 403 });
    }
  }
  const leavingScheduled    = prev?.status === "SCHEDULED" && body.status !== undefined && body.status !== "SCHEDULED";
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

  // When staying SCHEDULED but vehicle selection changes, adjust the credit delta
  const stayingScheduled = prev?.status === "SCHEDULED" && (body.status === "SCHEDULED" || body.status === undefined);
  const creditDelta = stayingScheduled && body.creditsUsed !== undefined
    ? (body.creditsUsed ?? 0) - (prev?.creditsUsed ?? 0)
    : 0;

  const creditsToDebit  = becomingScheduled ? (body.creditsUsed ?? 0) : (creditDelta > 0 ? creditDelta : 0);
  const creditsToReturn = leavingScheduled  ? (prev?.creditsUsed ?? 0) : (creditDelta < 0 ? -creditDelta : 0);

  // Fetch current creditsUsed to avoid going negative across plan/cycle boundaries
  const currentSub = creditsToReturn > 0
    ? await prisma.subscription.findUnique({ where: { ownerId: userId }, select: { creditsUsed: true } })
    : null;
  const safeReturn = creditsToReturn > 0
    ? Math.min(creditsToReturn, currentSub?.creditsUsed ?? 0)
    : 0;

  const [release] = await prisma.$transaction([
    prisma.release.update({ where: { id }, data: updateData }),
    ...(creditsToDebit > 0
      ? [prisma.subscription.update({
          where: { ownerId: userId },
          data: { creditsUsed: { increment: creditsToDebit } },
        })]
      : []),
    ...(safeReturn > 0
      ? [prisma.subscription.update({
          where: { ownerId: userId },
          data: { creditsUsed: { decrement: safeReturn } },
        })]
      : []),
  ]);

  // Notify admin when a release is newly scheduled
  if (becomingScheduled) {
    try {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(userId);
      const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.emailAddresses[0]?.emailAddress || userId;
      const userEmail = user.emailAddresses[0]?.emailAddress || "";
      const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : prev?.scheduledAt ?? null;
      const vehicleCount = (body.vehicles ?? prev?.vehicles ?? []).length;
      await sendAdminNewReleaseEmail(body.title ?? prev?.title ?? "Sem título", userName, userEmail, vehicleCount, scheduledAt);
    } catch (err) {
      console.error("Admin notification email failed:", err);
    }
  }

  return NextResponse.json(release);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const prisma = getPrisma();
  const release = await prisma.release.findUnique({ where: { id }, select: { status: true, creditsUsed: true } });
  const creditsToReturn = release?.status === "SCHEDULED" ? (release.creditsUsed ?? 0) : 0;

  // Clamp return to current creditsUsed to avoid going negative across plan/cycle boundaries
  const currentSub = creditsToReturn > 0
    ? await prisma.subscription.findUnique({ where: { ownerId: userId }, select: { creditsUsed: true } })
    : null;
  const safeReturn = creditsToReturn > 0
    ? Math.min(creditsToReturn, currentSub?.creditsUsed ?? 0)
    : 0;

  await prisma.$transaction([
    prisma.release.delete({ where: { id } }),
    ...(safeReturn > 0
      ? [prisma.subscription.update({
          where: { ownerId: userId },
          data: { creditsUsed: { decrement: safeReturn } },
        })]
      : []),
  ]);
  return NextResponse.json({ ok: true });
}
