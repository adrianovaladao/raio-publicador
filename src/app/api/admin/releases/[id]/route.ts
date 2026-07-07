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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const me = await currentUser();
  if (me?.publicMetadata?.raioAdmin !== true) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as {
    status: ReleaseStatus;
    adminNotes?: string;
    publishedVehicleUrls?: Record<string, string>;
  };

  const prisma = getPrisma();
  const prev = await prisma.release.findUnique({
    where: { id },
    select: { status: true, authorId: true, title: true, vehicles: true },
  });
  if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updateData: Record<string, unknown> = { status: body.status };
  if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes;
  if (body.publishedVehicleUrls !== undefined) updateData.publishedVehicleUrls = body.publishedVehicleUrls;
  if (body.status === "PUBLISHED") updateData.publishedAt = new Date();

  const release = await prisma.release.update({ where: { id }, data: updateData });

  // Send notification emails based on status transition
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(prev.authorId);
    const firstName = user.firstName ?? user.emailAddresses[0]?.emailAddress?.split("@")[0] ?? "usuário";
    const email = user.emailAddresses[0]?.emailAddress ?? "";

    if (email) {
      if (body.status === "NEEDS_REVISION") {
        await sendReleaseNeedsReviewEmail(email, firstName, prev.title, body.adminNotes ?? "", id);
      } else if (body.status === "REJECTED") {
        await sendReleaseRejectedEmail(email, firstName, prev.title, body.adminNotes ?? "", id);
      } else if (body.status === "IN_PUBLICATION") {
        await sendReleaseInPublicationEmail(email, firstName, prev.title, id);
      } else if (body.status === "PUBLISHED") {
        const urls = body.publishedVehicleUrls ?? {};
        await sendReleasePublishedWithLinksEmail(email, firstName, prev.title, urls, id);
      }
    }
  } catch (err) {
    console.error("Email notification failed:", err);
  }

  return NextResponse.json(release);
}
