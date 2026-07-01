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
  const body = await req.json();
  const prisma = getPrisma();
  const release = await prisma.release.create({ data: { ...body, authorId: userId } });
  if (body.status === "SCHEDULED" && body.creditsUsed > 0) {
    await prisma.subscription.updateMany({
      where: { ownerId: userId },
      data: { creditsUsed: { increment: body.creditsUsed } },
    });
  }
  return NextResponse.json(release, { status: 201 });
}
