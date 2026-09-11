export const dynamic = "force-dynamic";
import { clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ReleaseStatus } from "@prisma/client";
import {
  sendReleaseScheduledEmail,
  sendReleaseNeedsReviewEmail,
  sendReleaseRejectedEmail,
  sendReleaseInPublicationEmail,
  sendReleasePublishedWithLinksEmail,
} from "@/lib/email";

import { assertAnyAdmin } from "@/lib/admin-server";
import { createNotification } from "@/lib/notify";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAnyAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as {
    status?: ReleaseStatus;
    adminNotes?: string;
    publishedVehicleUrls?: Record<string, string>;
    notifyUser?: boolean;
    archive?: boolean;   // true = arquivar, false = desarquivar
    scheduledAt?: string; // ISO string; usado ao mover para SCHEDULED
    // edição de conteúdo pelo admin
    title?: string;
    summary?: string;
    body?: string;
  };

  const prisma = getPrisma();
  const prev = await prisma.release.findUnique({
    where: { id },
    select: { status: true, authorId: true, title: true, vehicles: true, scheduledAt: true },
  });
  if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (body.status !== undefined) updateData.status = body.status;
  if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes;
  if (body.publishedVehicleUrls !== undefined) updateData.publishedVehicleUrls = body.publishedVehicleUrls;
  if (body.status === "PUBLISHED") updateData.publishedAt = new Date();
  if (body.archive === true)  updateData.archivedAt = new Date();
  if (body.archive === false) updateData.archivedAt = null;
  // edição de conteúdo pelo admin
  if (body.title   !== undefined) updateData.title   = body.title;
  if (body.summary !== undefined) updateData.summary = body.summary;
  if ((body as { body?: string }).body !== undefined) updateData.body = (body as { body?: string }).body;

  const release = await prisma.release.update({ where: { id }, data: updateData });

  // Fire notifications asynchronously — respond immediately so the client never times out
  // Notifica se: status mudou OU admin clicou explicitamente em "Publicar e notificar" (notifyUser=true)
  // Isso permite reenviar o email de publicação ao atualizar os links mesmo sem mudar o status
  const shouldNotify = body.status && (
    (body.notifyUser !== false && body.status !== prev.status) ||
    body.notifyUser === true
  );
  if (shouldNotify) {
    (async () => {
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(prev.authorId);
        const firstName = user.firstName ?? user.emailAddresses[0]?.emailAddress?.split("@")[0] ?? "usuário";
        const email = user.emailAddresses[0]?.emailAddress ?? "";

        if (!email) return;

        if (body.status === "SCHEDULED") {
          const vehicleIds = prev.vehicles as string[];
          const vehicleRows = vehicleIds.length > 0
            ? await prisma.vehicle.findMany({ where: { id: { in: vehicleIds } }, select: { name: true } })
            : [];
          const vehicleNames = vehicleRows.map(v => v.name);
          const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : (prev.scheduledAt ?? new Date());
          await sendReleaseScheduledEmail(email, firstName, prev.title, scheduledAt, vehicleNames, id);
          createNotification(prev.authorId, "release_scheduled",
            "Release agendado",
            `"${prev.title}" foi aprovado e está agendado para publicação.`,
            `/releases/${id}`,
          ).catch(console.error);
        } else if (body.status === "NEEDS_REVISION") {
          await sendReleaseNeedsReviewEmail(email, firstName, prev.title, body.adminNotes ?? "", id);
          createNotification(prev.authorId, "release_needs_revision",
            "Release precisa de revisão",
            `"${prev.title}" precisa de ajustes antes de ser publicado.`,
            `/releases/${id}`,
          ).catch(console.error);
        } else if (body.status === "REJECTED") {
          await sendReleaseRejectedEmail(email, firstName, prev.title, body.adminNotes ?? "", id);
          createNotification(prev.authorId, "release_rejected",
            "Release rejeitado",
            `"${prev.title}" foi recusado. Veja os detalhes e entre em contato com o suporte.`,
            `/releases/${id}`,
          ).catch(console.error);
        } else if (body.status === "IN_PUBLICATION") {
          await sendReleaseInPublicationEmail(email, firstName, prev.title, id);
        } else if (body.status === "PUBLISHED") {
          const rawUrls = body.publishedVehicleUrls ?? {};
          const vehicleIds = Object.keys(rawUrls);
          let urlsByName: Record<string, string> = rawUrls;
          if (vehicleIds.length > 0) {
            const vehicles = await prisma.vehicle.findMany({
              where: { id: { in: vehicleIds } },
              select: { id: true, name: true },
            });
            const idToName: Record<string, string> = {};
            for (const v of vehicles) idToName[v.id] = v.name;
            urlsByName = Object.fromEntries(
              Object.entries(rawUrls).map(([vid, url]) => [idToName[vid] ?? vid, url])
            );
          }
          await sendReleasePublishedWithLinksEmail(email, firstName, prev.title, urlsByName, id);
          const vehicleCount = Object.keys(rawUrls).length || prev.vehicles.length;
          const urlValues = Object.values(rawUrls).map(u => u.trim()).filter(Boolean);
          const notifBody = urlValues.length > 0
            ? `"${prev.title}" foi publicado em ${vehicleCount} veículo${vehicleCount !== 1 ? "s" : ""}.\n${urlValues.join("\n")}`
            : `"${prev.title}" foi publicado em ${vehicleCount} veículo${vehicleCount !== 1 ? "s" : ""}.`;
          createNotification(prev.authorId, "release_published",
            "Release publicado",
            notifBody,
            `/releases/${id}`,
          ).catch(console.error);
        }
      } catch (err) {
        console.error("Email notification failed:", err);
      }
    })();
  }

  return NextResponse.json(release);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAnyAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const prisma = getPrisma();

  const release = await prisma.release.findUnique({
    where: { id },
    select: { status: true, creditsUsed: true, authorId: true, archivedAt: true },
  });
  if (!release) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft-delete: arquiva o release em vez de apagar do banco.
  // O usuário continua vendo seus próprios releases; o admin remove da fila ativa.
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
    prisma.release.update({ where: { id }, data: { archivedAt: new Date() } }),
    ...(safeReturn > 0 ? [prisma.subscription.update({
      where: { ownerId: release.authorId },
      data: { creditsUsed: { decrement: safeReturn } },
    })] : []),
  ]);

  return NextResponse.json({ ok: true });
}
