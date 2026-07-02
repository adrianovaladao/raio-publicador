export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
  const body = await req.json() as { status: string; creditsUsed: number; vehicles: string[]; [k: string]: unknown };
  console.log("[releases POST] status:", body.status, "creditsUsed:", body.creditsUsed, "vehicles:", body.vehicles?.length);
  const prisma = getPrisma();
  const release = await prisma.release.create({ data: { ...body, authorId: userId } });
  if (body.status === "SCHEDULED" && body.creditsUsed > 0) {
    const sub = await prisma.subscription.updateMany({
      where: { ownerId: userId },
      data: { creditsUsed: { increment: body.creditsUsed } },
    });
    console.log("[releases POST] subscription updated:", sub.count, "rows");
  } else {
    console.log("[releases POST] skipped credit debit — status or creditsUsed is zero/falsy");
  }
  return NextResponse.json(release, { status: 201 });
}
