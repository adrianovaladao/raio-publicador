export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [brands, releases] = await Promise.all([
    getPrisma().brand.findMany({ where: { ownerId: userId }, orderBy: { name: "asc" } }),
    getPrisma().release.findMany({
      where: { brand: { ownerId: userId } },
      select: { id: true, status: true, brandId: true, creditsUsed: true, title: true, createdAt: true, scheduledAt: true, publishedAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  type ReleaseRow = { id: string; status: string; brandId: string; creditsUsed: number; title: string; createdAt: Date; scheduledAt: Date | null; publishedAt: Date | null };
  type BrandRow   = { id: string; name: string; segment: string | null; color: string | null; site: string | null; contact: string | null; description: string | null; logoUrl: string | null; ownerId: string; createdAt: Date; updatedAt: Date };
  const rels = releases as unknown as ReleaseRow[];
  const brs  = brands   as unknown as BrandRow[];
  const stats = {
    total:     rels.length,
    published: rels.filter(r => r.status === "PUBLISHED").length,
    scheduled: rels.filter(r => r.status === "SCHEDULED").length,
    draft:     rels.filter(r => r.status === "DRAFT").length,
  };
  const brandsWithCounts = brs.map(b => {
    const brandRels = rels.filter(r => r.brandId === b.id);
    const recentReleases = brandRels.slice(0, 5).map(r => ({
      id: r.id,
      title: r.title,
      status: r.status.toLowerCase(),
      date: (r.scheduledAt ?? r.publishedAt ?? r.createdAt).toISOString(),
      creditsUsed: r.creditsUsed,
    }));
    return {
      ...b,
      releases: brandRels.length,
      creditsUsed: brandRels.reduce((sum, r) => sum + (r.creditsUsed ?? 0), 0),
      publishedCount: brandRels.filter(r => r.status === "PUBLISHED").length,
      recentReleases,
    };
  });
  return NextResponse.json({ stats, brands: brandsWithCounts });
}
