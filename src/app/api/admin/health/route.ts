export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { assertMaster } from "@/lib/admin-server";

export async function GET() {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prisma = getPrisma();
  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const twoDaysAgo  = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  try {
    const [
      totalSubs,
      activeSubs,
      activeNoPeriodEnd,
      negativeCredits,
      stuckReleases,
      oldPixPending,
      totalReleases,
      totalVehicles,
    ] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.subscription.count({ where: { status: "ACTIVE", currentPeriodEnd: null } }),
      prisma.subscription.count({ where: { creditsUsed: { lt: 0 } } }),
      prisma.release.count({ where: { status: { in: ["IN_REVIEW", "IN_PUBLICATION"] }, updatedAt: { lt: fiveDaysAgo } } }),
      prisma.pixPayment.count({ where: { status: "PENDING", createdAt: { lt: twoDaysAgo } } }),
      prisma.release.count(),
      prisma.vehicle.count(),
    ]);

    const issues: string[] = [];
    if (activeNoPeriodEnd > 0) issues.push(`${activeNoPeriodEnd} assinatura(s) ACTIVE sem currentPeriodEnd`);
    if (negativeCredits > 0)   issues.push(`${negativeCredits} usuário(s) com créditos negativos`);
    if (stuckReleases > 0)     issues.push(`${stuckReleases} release(s) travado(s) em revisão/publicação há +5 dias`);
    if (oldPixPending > 0)     issues.push(`${oldPixPending} pagamento(s) Pix PENDING há +48h`);

    return NextResponse.json({
      ok: issues.length === 0,
      checkedAt: now.toISOString(),
      issues,
      stats: {
        totalSubs,
        activeSubs,
        totalReleases,
        totalVehicles,
      },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
