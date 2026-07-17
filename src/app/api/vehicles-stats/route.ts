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

  const ranked = sorted
    .map(([id, count]) => {
      const v = vMap[id];
      if (!v) return null; // vehicle deleted — skip orphan
      return { id, count, name: v.name, domain: v.domain, tier: v.tier, reach: v.reach };
    })
    .filter(Boolean) as { id: string; count: number; name: string; domain: string; tier: string; reach: number }[];

  // Top 1 por tier (A, B, C) por alcance + total de veículos + última atualização
  const [topByTierRaw, vehicleCount, lastUpdated] = await Promise.all([
    getPrisma().vehicle.findMany({
      where: { tier: { in: ["A", "B", "C"] } },
      select: { id: true, name: true, domain: true, tier: true, reach: true },
      orderBy: { reach: "desc" },
    }),
    getPrisma().vehicle.count(),
    getPrisma().vehicle.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
  ]);
  const topPerTier: Record<string, { id: string; name: string; domain: string; tier: string; reach: number }> = {};
  for (const v of topByTierRaw) {
    if (!topPerTier[v.tier]) topPerTier[v.tier] = v;
  }
  const topVehicles = ["A", "B", "C"].map(t => topPerTier[t]).filter(Boolean);

  return NextResponse.json({
    ranked,
    totalReleases: releases.length,
    topVehicles,
    vehicleCount,
    lastUpdated: lastUpdated?.updatedAt?.toISOString() ?? null,
  });
}
