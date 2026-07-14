export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const prisma = getPrisma();

  const original = await prisma.release.findUnique({
    where: { id },
    select: { authorId: true, title: true, body: true, summary: true, brandId: true, imageUrl: true, vehicles: true },
  });

  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (original.authorId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const copy = await prisma.release.create({
    data: {
      authorId:    userId,
      title:       `[CÓPIA] ${original.title}`,
      body:        original.body ?? "",
      summary:     original.summary ?? "",
      status:      "DRAFT",
      brandId:     original.brandId,
      imageUrl:    original.imageUrl ?? null,
      vehicles:    original.vehicles ?? [],
      creditsUsed: 0,
      scheduledAt: null,
    },
  });

  return NextResponse.json(copy);
}
