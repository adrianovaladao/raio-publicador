export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const now = new Date();

  const expired = await prisma.subscription.findMany({
    where: {
      plan:             "VOUCHER",
      status:           "ACTIVE",
      currentPeriodEnd: { lt: now },
    },
    select: { id: true, ownerId: true },
  });

  if (expired.length === 0)
    return NextResponse.json({ expired: 0 });

  await prisma.subscription.updateMany({
    where: { id: { in: expired.map(s => s.id) } },
    data:  { status: "INACTIVE", creditsTotal: 0 },
  });

  console.log(`[cron/expire-vouchers] Expired ${expired.length} voucher subscriptions`);
  return NextResponse.json({ expired: expired.length, ids: expired.map(s => s.ownerId) });
}
