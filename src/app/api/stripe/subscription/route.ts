export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getPrisma().subscription.findUnique({ where: { ownerId: userId } });
  if (!sub) return NextResponse.json({ plan: null, status: null, brandsLimit: null });

  const planMeta = PLANS[sub.plan as keyof typeof PLANS] ?? null;
  return NextResponse.json({
    plan: sub.plan,
    status: sub.status,
    brandsLimit: planMeta?.brandsLimit ?? null,
    editorsLimit: planMeta?.editorsLimit ?? null,
    reviewersLimit: planMeta?.reviewersLimit ?? null,
    label: planMeta?.label ?? sub.plan,
    priceCents: planMeta?.priceCents ?? null,
    credits: sub.creditsTotal,
    creditsUsed: sub.creditsUsed,
    currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
  });
}
