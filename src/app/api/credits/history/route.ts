export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();

  const releases = await prisma.release.findMany({
    where: {
      authorId: userId,
      creditsUsed: { gt: 0 },
    },
    select: {
      id: true,
      title: true,
      creditsUsed: true,
      status: true,
      scheduledAt: true,
      createdAt: true,
      brand: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const rows = releases.map(r => ({
    id: r.id,
    title: r.title,
    creditsUsed: r.creditsUsed,
    status: r.status.toLowerCase(),
    date: r.scheduledAt ?? r.createdAt,
    brandName: r.brand?.name ?? "—",
  }));

  return NextResponse.json(rows);
}
