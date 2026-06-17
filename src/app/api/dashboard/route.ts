export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [brands, releases] = await Promise.all([
    getPrisma().brand.findMany({ where: { ownerId: userId }, orderBy: { name: "asc" } }),
    getPrisma().release.findMany({ where: { brand: { ownerId: userId } }, select: { status: true, brandId: true } }),
  ]);
  type ReleaseRow = { status: string; brandId: string };
  type BrandRow   = { id: string; name: string; segment: string | null; color: string | null; ownerId: string; createdAt: Date; updatedAt: Date };
  const rels = releases as unknown as ReleaseRow[];
  const brs  = brands   as unknown as BrandRow[];
  const stats = {
    total:     rels.length,
    published: rels.filter(r => r.status === "PUBLISHED").length,
    scheduled: rels.filter(r => r.status === "SCHEDULED").length,
    draft:     rels.filter(r => r.status === "DRAFT").length,
  };
  const brandsWithCounts = brs.map(b => ({
    ...b,
    releases: rels.filter(r => r.brandId === b.id).length,
  }));
  return NextResponse.json({ stats, brands: brandsWithCounts });
}
