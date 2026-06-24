export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const releases = await getPrisma().release.findMany({
    where: { brand: { ownerId: userId } },
    select: { vehicles: true },
  });

  // Count how many releases each vehicle appears in
  const counts: Record<string, number> = {};
  for (const r of releases) {
    for (const vid of r.vehicles ?? []) {
      counts[vid] = (counts[vid] ?? 0) + 1;
    }
  }

  // Sort by count descending, return top 10
  const ranked = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, count }));

  return NextResponse.json({ ranked, totalReleases: releases.length });
}
