export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { PLANS, type PlanId } from "@/lib/plans";
import { NextResponse } from "next/server";
import { isAnyAdmin } from "@/lib/admin";

async function assertRaioAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return isAnyAdmin(user?.publicMetadata as Record<string, unknown>);
}

export async function GET() {
  if (!await assertRaioAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prisma = getPrisma();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [subs, releases] = await Promise.all([
    prisma.subscription.findMany(),
    prisma.release.findMany({ select: { status: true, creditsUsed: true, createdAt: true } }),
  ]);

  // ── Users by plan ────────────────────────────────────────────────────────────
  const byPlan: Record<string, number> = { BASIC: 0, ADVANCED: 0, PROFESSIONAL: 0 };
  const byStatus: Record<string, number> = { ACTIVE: 0, INACTIVE: 0, PAST_DUE: 0, CANCELLED: 0 };

  let mrrCents = 0;
  let mrrLastMonthCents = 0;
  let totalCreditsConsumed = 0;

  for (const s of subs) {
    byPlan[s.plan] = (byPlan[s.plan] ?? 0) + 1;
    byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
    if (s.status === "ACTIVE") {
      const price = PLANS[s.plan as PlanId]?.priceCents ?? 0;
      mrrCents += price;
      // Estimate last month MRR: active subs created before end of last month
      if (s.createdAt <= endOfLastMonth) mrrLastMonthCents += price;
    }
    totalCreditsConsumed += s.creditsUsed;
  }

  const newUsersLast30 = subs.filter(s => s.createdAt >= thirtyDaysAgo).length;
  const newUsersThisMonth = subs.filter(s => s.createdAt >= startOfMonth).length;
  const newUsersLastMonth = subs.filter(s => s.createdAt >= startOfLastMonth && s.createdAt <= endOfLastMonth).length;

  // ── Releases ─────────────────────────────────────────────────────────────────
  const releasesByStatus: Record<string, number> = { DRAFT: 0, SCHEDULED: 0, PUBLISHED: 0, CANCELLED: 0 };
  let releasesThisMonth = 0;
  let totalCreditsFromReleases = 0;
  for (const r of releases) {
    releasesByStatus[r.status] = (releasesByStatus[r.status] ?? 0) + 1;
    if (r.createdAt >= startOfMonth) releasesThisMonth++;
    totalCreditsFromReleases += r.creditsUsed;
  }

  const mrrGrowth = mrrLastMonthCents > 0
    ? Math.round(((mrrCents - mrrLastMonthCents) / mrrLastMonthCents) * 100)
    : null;

  return NextResponse.json({
    totalUsers: subs.length,
    byPlan,
    byStatus,
    mrr: mrrCents / 100,
    mrrLastMonth: mrrLastMonthCents / 100,
    mrrGrowth,
    newUsersLast30,
    newUsersThisMonth,
    newUsersLastMonth,
    totalReleases: releases.length,
    releasesByStatus,
    releasesThisMonth,
    totalCreditsConsumed,
    totalCreditsFromReleases,
  });
}
