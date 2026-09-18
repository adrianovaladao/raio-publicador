export const dynamic = "force-dynamic";
import { clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const PROVISION_SECRET = process.env.PROVISION_SECRET ?? "";

export async function POST(req: Request) {
  const { secret, userId, plan, credits } = await req.json() as {
    secret: string; userId: string; plan?: string; credits?: number;
  };
  if (!PROVISION_SECRET || secret !== PROVISION_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const results: string[] = [];

  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    results.push(`clerk: user ${user.emailAddresses[0]?.emailAddress} OK`);
  } catch (e) { return NextResponse.json({ error: `Clerk user not found: ${String(e)}` }, { status: 404 }); }

  if (plan && credits !== undefined) {
    const existing = await prisma.subscription.findUnique({ where: { ownerId: userId } });
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (existing) {
      await prisma.subscription.update({
        where: { ownerId: userId },
        data: { plan, status: "ACTIVE", creditsTotal: credits, currentPeriodStart: now, currentPeriodEnd: periodEnd },
      });
      results.push(`subscription: atualizada — plano ${plan}, ${credits} créditos`);
    } else {
      await prisma.subscription.create({
        data: { ownerId: userId, plan, status: "ACTIVE", creditsTotal: credits, creditsUsed: 0, currentPeriodStart: now, currentPeriodEnd: periodEnd },
      });
      results.push(`subscription: criada — plano ${plan}, ${credits} créditos`);
    }
  }

  return NextResponse.json({ ok: true, results });
}
