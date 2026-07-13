export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get("brandId");

  const releases = await getPrisma().release.findMany({
    where: {
      brand: { ownerId: userId },
      ...(brandId ? { brandId } : {}),
    },
    select: { vehicles: true },
  });

  // Count how many releases each vehicle appears in
  const counts: Record<string, number> = {};
  for (const r of releases) {
    for (const vid of r.vehicles ?? []) {
      counts[vid] = (counts[vid] ?? 0) + 1;
    }
  }

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const ids = sorted.map(([id]) => id);
  const vehicles = ids.length
    ? await getPrisma().vehicle.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, domain: true, tier: true, reach: true } })
    : [];

  const vMap = Object.fromEntries(vehicles.map(v => [v.id, v]));

  const ranked = sorted.map(([id, count]) => {
    const v = vMap[id] ?? { name: id, domain: "", tier: "E", reach: 0 };
    return { id, count, name: v.name, domain: v.domain, tier: v.tier, reach: v.reach };
  });

  return NextResponse.json({ ranked, totalReleases: releases.length });
}
