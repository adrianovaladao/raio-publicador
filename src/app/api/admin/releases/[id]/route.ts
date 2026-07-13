export const dynamic = "force-dynamic";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ReleaseStatus } from "@prisma/client";
import {
  sendReleaseNeedsReviewEmail,
  sendReleaseRejectedEmail,
  sendReleaseInPublicationEmail,
  sendReleasePublishedWithLinksEmail,
} from "@/lib/email";

import { isAnyAdmin } from "@/lib/admin";
import { createNotification } from "@/lib/notify";

async function assertAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const me = await currentUser();
  return isAnyAdmin(me?.publicMetadata as Record<string, unknown>);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as {
    status?: ReleaseStatus;
    adminNotes?: string;
    publishedVehicleUrls?: Record<string, string>;
    notifyUser?: boolean;
  };

  const prisma = getPrisma();
  const prev = await prisma.release.findUnique({
    where: { id },
    select: { status: true, authorId: true, title: true, vehicles: true },
  });
  if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (body.status !== undefined) updateData.status = body.status;
  if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes;
  if (body.publishedVehicleUrls !== undefined) updateData.publishedVehicleUrls = body.publishedVehicleUrls;
  if (body.status === "PUBLISHED") updateData.publishedAt = new Date();

  const release = await prisma.release.update({ where: { id }, data: updateData });

  // Send notification emails
  if (body.notifyUser !== false && body.status && body.status !== prev.status) {
    try {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(prev.authorId);
      const firstName = user.firstName ?? user.emailAddresses[0]?.emailAddress?.split("@")[0] ?? "usuário";
      const email = user.emailAddresses[0]?.emailAddress ?? "";

      if (email) {
        if (body.status === "NEEDS_REVISION") {
          await sendReleaseNeedsReviewEmail(email, firstName, prev.title, body.adminNotes ?? "", id);
          await createNotification(prev.authorId, "release_needs_revision",
            "Release precisa de revisão",
            `"${prev.title}" precisa de ajustes antes de ser publicado.`,
            `/releases/${id}`,
          ).catch(console.error);
        } else if (body.status === "REJECTED") {
          await sendReleaseRejectedEmail(email, firstName, prev.title, body.adminNotes ?? "", id);
          await createNotification(prev.authorId, "release_rejected",
            "Release rejeitado",
            `"${prev.title}" foi recusado. Veja os detalhes e entre em contato com o suporte.`,
            `/releases/${id}`,
          ).catch(console.error);
        } else if (body.status === "IN_PUBLICATION") {
          await sendReleaseInPublicationEmail(email, firstName, prev.title, id);
        } else if (body.status === "PUBLISHED") {
          const urls = body.publishedVehicleUrls ?? {};
          await sendReleasePublishedWithLinksEmail(email, firstName, prev.title, urls, id);
          const vehicleCount = Object.keys(urls).length || prev.vehicles.length;
          const urlValues = Object.values(urls as Record<string, string>).map(u => u.trim()).filter(Boolean);
          const notifBody = urlValues.length > 0
            ? `"${prev.title}" foi publicado em ${vehicleCount} veículo${vehicleCount !== 1 ? "s" : ""}.\n${urlValues.join("\n")}`
            : `"${prev.title}" foi publicado em ${vehicleCount} veículo${vehicleCount !== 1 ? "s" : ""}.`;
          await createNotification(prev.authorId, "release_published",
            "Release publicado",
            notifBody,
            `/releases/${id}`,
          ).catch(console.error);
        }
      }
    } catch (err) {
      console.error("Email notification failed:", err);
    }
  }

  return NextResponse.json(release);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const prisma = getPrisma();

  // Return credits if release was scheduled
  const release = await prisma.release.findUnique({
    where: { id },
    select: { status: true, creditsUsed: true, authorId: true },
  });
  if (!release) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const creditsToReturn = ["SCHEDULED", "IN_REVIEW", "IN_PUBLICATION"].includes(release.status)
    ? release.creditsUsed ?? 0
    : 0;

  const currentSub = creditsToReturn > 0
    ? await prisma.subscription.findUnique({ where: { ownerId: release.authorId }, select: { creditsUsed: true } })
    : null;
  const safeReturn = creditsToReturn > 0
    ? Math.min(creditsToReturn, currentSub?.creditsUsed ?? 0)
    : 0;

  await prisma.$transaction([
    prisma.release.delete({ where: { id } }),
    ...(safeReturn > 0 ? [prisma.subscription.update({
      where: { ownerId: release.authorId },
      data: { creditsUsed: { decrement: safeReturn } },
    })] : []),
  ]);

  return NextResponse.json({ ok: true });
}
