export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { PLANS, type PlanId } from "@/lib/plans";
import { NextResponse } from "next/server";
import { assertMaster } from "@/lib/admin-server";

/**
 * POST /api/admin/fix-pix-credits
 *
 * Corrige créditos de assinantes Pix cujo pagamento foi confirmado no C6 Bank
 * mas os créditos não foram resetados (bug: webhook registrado em sandbox).
 *
 * Critério: ACTIVE + sem stripeSubscriptionId + creditsUsed >= creditsTotal
 * (usou tudo mas nunca teve reset neste ciclo).
 *
 * Rota de uso único — remover após execução confirmada.
 */
export async function POST() {
  if (!(await assertMaster())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const prisma = getPrisma();

  // Busca assinantes Pix ativos com créditos esgotados
  const affected = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      stripeSubscriptionId: null,
      plan: { in: Object.keys(PLANS) as PlanId[] },
    },
    select: {
      id: true,
      ownerId: true,
      plan: true,
      creditsTotal: true,
      creditsUsed: true,
      currentPeriodEnd: true,
    },
  });

  // Filtra apenas os que estão com 0 disponíveis (usaram tudo ou nunca tiveram reset)
  const toFix = affected.filter(s => s.creditsUsed >= s.creditsTotal);

  const results = [];
  for (const sub of toFix) {
    const plan = PLANS[sub.plan as PlanId];
    if (!plan) continue;

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        creditsTotal: plan.credits,
        creditsUsed: 0,
      },
    });

    results.push({
      ownerId: sub.ownerId,
      plan: sub.plan,
      before: { creditsTotal: sub.creditsTotal, creditsUsed: sub.creditsUsed },
      after: { creditsTotal: plan.credits, creditsUsed: 0 },
    });
  }

  return NextResponse.json({
    fixed: results.length,
    results,
  });
}
