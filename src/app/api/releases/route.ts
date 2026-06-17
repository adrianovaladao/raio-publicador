import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const releases = await prisma.release.findMany({
    where: { brand: { ownerId: userId } },
    include: { brand: { select: { name: true, color: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(releases);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const release = await prisma.release.create({ data: { ...body, authorId: userId } });
  return NextResponse.json(release, { status: 201 });
}
