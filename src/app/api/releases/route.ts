export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { sendReleaseScheduledEmail, sendLowCreditsEmail, sendZeroCreditsEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import { ReleaseStatus } from "@prisma/client";

function extractFirstImageUrl(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const releases = await getPrisma().release.findMany({
    where: { brand: { ownerId: userId } },
    include: { brand: { select: { name: true, color: true, logoUrl: true } } },
    orderBy: { createdAt: "desc" },
  });
  // Backfill imageUrl from body for releases that were saved before this field was populated
  const enriched = releases.map(r => ({
    ...r,
    imageUrl: r.imageUrl ?? extractFirstImageUrl(r.body),
  }));
  return NextResponse.json(enriched);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as { status: string; creditsUsed: number; title: string; body: string; summary?: string; scheduledAt?: string | null; brandId: string; imageUrl?: string | null; vehicles: string[] };
  console.log("[releases POST] status:", body.status, "creditsUsed:", body.creditsUsed, "vehicles:", body.vehicles?.length);
  const prisma = getPrisma();

  const sub = await prisma.subscription.findUnique({
    where: { ownerId: userId },
    select: { status: true, creditsTotal: true, creditsUsed: true },
  });

  if (body.status === "SCHEDULED") {
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

  // Email notifications (fire-and-forget)
  if (body.status === "SCHEDULED" && sub) {
    const user = await currentUser();
    const firstName = user?.firstName ?? user?.emailAddresses[0]?.emailAddress?.split("@")[0] ?? "usuário";
    const email = user?.emailAddresses[0]?.emailAddress;

    if (email) {
      // Release agendado
      const vehicleNames = body.vehicles?.length
        ? (await prisma.vehicle.findMany({ where: { id: { in: body.vehicles } }, select: { name: true } })).map(v => v.name)
        : [];
      await sendReleaseScheduledEmail(
        email, firstName, body.title,
        body.scheduledAt ? new Date(body.scheduledAt) : new Date(),
        vehicleNames,
        release.id,
      ).then(res => {
        console.log("[email] release agendado enviado para", email, res);
      }).catch(err => {
        console.error("[email] erro ao enviar release agendado para", email, err);
      });

      // Créditos baixos ou zerados após débito
      const remaining = (sub.creditsTotal - sub.creditsUsed) - creditsToDebit;
      const threshold = Math.floor(sub.creditsTotal * 0.2);
      if (remaining <= 0) {
        await sendZeroCreditsEmail(email, firstName).catch(err => console.error("[email] erro créditos zerados", err));
      } else if (remaining <= threshold) {
        await sendLowCreditsEmail(email, firstName, remaining).catch(err => console.error("[email] erro créditos baixos", err));
      }
    } else {
      console.warn("[email] usuário sem email no Clerk:", userId);
    }
  }

  return NextResponse.json(release, { status: 201 });
}
