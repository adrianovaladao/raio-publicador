export const dynamic = "force-dynamic";
import { clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendVoucherExpiringEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const now = new Date();

  // ── 1. Expira vouchers vencidos ───────────────────────────────────────────
  const expired = await prisma.subscription.findMany({
    where: { plan: "VOUCHER", status: "ACTIVE", currentPeriodEnd: { lt: now } },
    select: { id: true, ownerId: true },
  });

  if (expired.length > 0) {
    await prisma.subscription.updateMany({
      where: { id: { in: expired.map(s => s.id) } },
      data:  { status: "INACTIVE", creditsTotal: 0 },
    });
    console.log(`[cron/expire-vouchers] Expired ${expired.length} voucher subscriptions`);
  }

  // ── 2. Avisa vouchers que vencem em 1 ou 3 dias ───────────────────────────
  const results = { expired: expired.length, notified1d: 0, notified3d: 0, errors: 0 };

  for (const daysLeft of [1, 3] as const) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() + daysLeft);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const expiring = await prisma.subscription.findMany({
      where: {
        plan: "VOUCHER",
        status: "ACTIVE",
        currentPeriodEnd: { gte: dayStart, lte: dayEnd },
      },
      select: { ownerId: true, currentPeriodEnd: true },
    });

    if (expiring.length === 0) continue;

    const clerk = await clerkClient();
    for (const sub of expiring) {
      try {
        const user = await clerk.users.getUser(sub.ownerId);
        const email = user.emailAddresses[0]?.emailAddress;
        const firstName = user.firstName ?? email?.split("@")[0] ?? "usuário";
        if (!email) continue;
        await sendVoucherExpiringEmail(email, firstName, sub.currentPeriodEnd!, daysLeft);
        if (daysLeft === 1) results.notified1d++;
        else results.notified3d++;
      } catch (err) {
        console.error(`[cron/expire-vouchers] Erro ao notificar ${sub.ownerId}:`, err);
        results.errors++;
      }
    }
  }

  console.log(`[cron/expire-vouchers]`, results);
  return NextResponse.json(results);
}
