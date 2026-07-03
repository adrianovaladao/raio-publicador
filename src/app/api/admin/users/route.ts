export const dynamic = "force-dynamic";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { PLANS, type PlanId } from "@/lib/plans";
import { NextRequest, NextResponse } from "next/server";

async function assertRaioAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return user?.publicMetadata?.raioAdmin === true;
}

export async function GET() {
  if (!await assertRaioAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prisma = getPrisma();
  const clerk = await clerkClient();

  // Fetch all subscriptions from DB
  const subs = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Fetch Clerk users for all ownerIds in parallel (batched)
  const clerkUsers = await clerk.users.getUserList({ limit: 500 });

  const clerkMap = new Map(clerkUsers.data.map(u => [u.id, u]));

  const rows = subs.map(sub => {
    const cu = clerkMap.get(sub.ownerId);
    const planId = sub.plan as PlanId;
    return {
      clerkId: sub.ownerId,
      email: cu?.emailAddresses[0]?.emailAddress ?? "—",
      firstName: cu?.firstName ?? "",
      lastName: cu?.lastName ?? "",
      createdAt: cu?.createdAt ?? sub.createdAt.getTime(),
      lastSignInAt: cu?.lastSignInAt ?? null,
      plan: planId,
      planLabel: PLANS[planId]?.label ?? planId,
      status: sub.status,
      creditsTotal: sub.creditsTotal,
      creditsUsed: sub.creditsUsed,
      creditsAvailable: sub.creditsTotal - sub.creditsUsed,
      stripeCustomerId: sub.stripeCustomerId ?? null,
      stripeSubscriptionId: sub.stripeSubscriptionId ?? null,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
    };
  });

  return NextResponse.json(rows);
}

// PATCH /api/admin/users — adjust credits or plan for a user
export async function PATCH(req: NextRequest) {
  if (!await assertRaioAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { clerkId, creditsTotal, creditsUsed, plan } = await req.json() as {
    clerkId: string;
    creditsTotal?: number;
    creditsUsed?: number;
    plan?: PlanId;
  };

  if (!clerkId) return NextResponse.json({ error: "clerkId obrigatório" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (creditsTotal != null) data.creditsTotal = creditsTotal;
  if (creditsUsed != null) data.creditsUsed = creditsUsed;
  if (plan) data.plan = plan;

  const updated = await getPrisma().subscription.update({
    where: { ownerId: clerkId },
    data,
  });

  return NextResponse.json({ ok: true, updated });
}
