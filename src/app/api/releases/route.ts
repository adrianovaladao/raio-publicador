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
  const release = await getPrisma().release.create({ data: { ...body, authorId: userId } });
  return NextResponse.json(release, { status: 201 });
}
