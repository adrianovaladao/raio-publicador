export const dynamic = "force-dynamic";
import { clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { assertMaster } from "@/lib/admin-server";
import { PLANS, type PlanId } from "@/lib/plans";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/provision-user
 *
 * Provisiona uma subscription para um usuário já criado no Clerk.
 * Usado para clientes que pagarão por Pix fora do fluxo padrão.
 *
 * Body: { clerkId: string; plan: PlanId }
 */
export async function POST(req: NextRequest) {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { clerkId, plan } = await req.json() as { clerkId: string; plan: PlanId };
  if (!clerkId || !plan)
    return NextResponse.json({ error: "clerkId e plan obrigatórios" }, { status: 400 });

  const planConfig = PLANS[plan];
  if (!planConfig)
    return NextResponse.json({ error: `Plano inválido: ${plan}` }, { status: 400 });

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(clerkId).catch(() => null);
  if (!user)
    return NextResponse.json({ error: "Usuário não encontrado no Clerk" }, { status: 404 });

  const prisma = getPrisma();
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const existing = await prisma.subscription.findUnique({ where: { ownerId: clerkId } });
  if (existing)
    return NextResponse.json({ error: "Usuário já possui assinatura", plan: existing.plan, status: existing.status }, { status: 409 });

  const sub = await prisma.subscription.create({
    data: {
      ownerId:            clerkId,
      plan,
      status:             "ACTIVE",
      creditsTotal:       planConfig.credits,
      creditsUsed:        0,
      currentPeriodStart: now,
      currentPeriodEnd:   periodEnd,
    },
  });

  return NextResponse.json({
    ok: true,
    subscriptionId: sub.id,
    plan,
    credits: planConfig.credits,
    currentPeriodEnd: periodEnd.toISOString(),
    email: user.emailAddresses[0]?.emailAddress,
  });
}
