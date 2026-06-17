import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [brands, releases] = await Promise.all([
    prisma.brand.findMany({ where: { ownerId: userId }, orderBy: { name: "asc" } }),
    prisma.release.findMany({ where: { brand: { ownerId: userId } }, select: { status: true, brandId: true } }),
  ]);
  const stats = {
    total: releases.length,
    published: releases.filter(r => r.status === "PUBLISHED").length,
    scheduled: releases.filter(r => r.status === "SCHEDULED").length,
    draft: releases.filter(r => r.status === "DRAFT").length,
  };
  const brandsWithCounts = brands.map(b => ({
    ...b,
    releases: releases.filter(r => r.brandId === b.id).length,
  }));
  return NextResponse.json({ stats, brands: brandsWithCounts });
}
