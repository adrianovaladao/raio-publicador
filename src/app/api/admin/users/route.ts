export const dynamic = "force-dynamic";
import { clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { PLANS, type PlanId } from "@/lib/plans";
import { NextRequest, NextResponse } from "next/server";
import { assertMaster } from "@/lib/admin-server";

export async function GET() {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prisma = getPrisma();
  const clerk = await clerkClient();

  // Fetch all subscriptions from DB
  const subs = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Fetch voucher redemptions (one per user at most — first redemption wins)
  const redemptions = await prisma.voucherRedemption.findMany({
    where: { userId: { in: subs.map(s => s.ownerId) } },
    include: { voucher: { select: { code: true } } },
    orderBy: { redeemedAt: "asc" },
  });
  const voucherMap = new Map<string, string>();
  for (const r of redemptions) {
    if (!voucherMap.has(r.userId)) voucherMap.set(r.userId, r.voucher.code);
  }

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
      isMarkable: !!(cu?.publicMetadata as Record<string, unknown>)?.isMarkable,
      voucherCode: voucherMap.get(sub.ownerId) ?? null,
    };
  });

  return NextResponse.json(rows);
}

// DELETE /api/admin/users — remove subscriptions for given clerkIds
export async function DELETE(req: NextRequest) {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { clerkIds } = await req.json() as { clerkIds: string[] };
  if (!Array.isArray(clerkIds) || clerkIds.length === 0)
    return NextResponse.json({ error: "clerkIds obrigatório" }, { status: 400 });

  const { count } = await getPrisma().subscription.deleteMany({ where: { ownerId: { in: clerkIds } } });
  return NextResponse.json({ deleted: count });
}

// PATCH /api/admin/users — adjust credits or plan for a user
export async function PATCH(req: NextRequest) {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { clerkId, creditsTotal, creditsUsed, plan, status, stripeCustomerId, stripeSubscriptionId, isMarkable } = await req.json() as {
    clerkId: string;
    creditsTotal?: number;
    creditsUsed?: number;
    plan?: PlanId;
    status?: string;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    isMarkable?: boolean;
  };

  if (!clerkId) return NextResponse.json({ error: "clerkId obrigatório" }, { status: 400 });

  const clerk = await clerkClient();

  // Update Clerk publicMetadata for isMarkable tag
  if (isMarkable !== undefined) {
    const cu = await clerk.users.getUser(clerkId);
    const existing = (cu.publicMetadata ?? {}) as Record<string, unknown>;
    await clerk.users.updateUserMetadata(clerkId, {
      publicMetadata: { ...existing, isMarkable },
    });
  }

  const data: Record<string, unknown> = {};
  if (creditsTotal != null) data.creditsTotal = creditsTotal;
  if (creditsUsed != null) data.creditsUsed = creditsUsed;
  if (plan) data.plan = plan;
  if (status) data.status = status;
  if (stripeCustomerId !== undefined) data.stripeCustomerId = stripeCustomerId || null;
  if (stripeSubscriptionId !== undefined) data.stripeSubscriptionId = stripeSubscriptionId || null;

  const updated = Object.keys(data).length > 0
    ? await getPrisma().subscription.update({ where: { ownerId: clerkId }, data })
    : null;

  return NextResponse.json({ ok: true, updated });
}
