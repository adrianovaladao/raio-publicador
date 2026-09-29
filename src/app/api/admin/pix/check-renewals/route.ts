export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { assertMaster } from "@/lib/admin-server";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  if (!await assertMaster()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prisma = getPrisma();
  const subs = await prisma.subscription.findMany({
    where: {
      stripeSubscriptionId: null,
      status: "ACTIVE",
      plan: { in: ["BASIC", "ADVANCED", "PROFESSIONAL"] },
    },
    select: {
      id: true,
      ownerId: true,
      plan: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      createdAt: true,
    },
  });

  const clerk = await clerkClient();
  const result = await Promise.all(subs.map(async (s) => {
    let email = "";
    try {
      const u = await clerk.users.getUser(s.ownerId);
      email = u.emailAddresses[0]?.emailAddress ?? "";
    } catch { /* ignorar */ }

    const now = new Date();
    const daysLeft = s.currentPeriodEnd
      ? Math.round((s.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return { ...s, email, daysLeft };
  }));

  return NextResponse.json({ count: result.length, subs: result });
}
