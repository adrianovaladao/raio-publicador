export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Se for membro de equipe, retorna assinatura do dono da conta (somente leitura)
  const prisma = getPrisma();
  const member = await prisma.teamMember.findUnique({
    where: { clerkId: userId },
    select: { ownerId: true, status: true },
  });
  const accountOwnerId = (member?.status === "ACTIVE") ? member.ownerId : userId;
  const isTeamMember = member?.status === "ACTIVE";

  const sub = await prisma.subscription.findUnique({ where: { ownerId: accountOwnerId } });
  if (!sub) {
    // Sem subscription no banco — verifica se é conta interna/admin (ADMIN_USER_IDS)
    const adminIds = (process.env.ADMIN_USER_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean);
    const isAdmin = adminIds.length > 0 && adminIds.includes(userId);
    return NextResponse.json({ plan: null, status: null, brandsLimit: null, isAdmin });
  }

  const planMeta = PLANS[sub.plan as keyof typeof PLANS] ?? null;
  // everPaid = true se o usuário já passou pelo Stripe em algum momento
  // Usado para distinguir "nunca pagou" (bloquear acesso) de "cancelou" (manter acesso)
  const everPaid = !!(sub.stripeCustomerId || sub.stripeSubscriptionId);
  return NextResponse.json({
    plan: sub.plan,
    status: sub.status,
    everPaid,
    brandsLimit: planMeta?.brandsLimit ?? null,
    editorsLimit: planMeta?.editorsLimit ?? null,
    reviewersLimit: planMeta?.reviewersLimit ?? null,
    label: planMeta?.label ?? sub.plan,
    priceCents: planMeta?.priceCents ?? null,
    credits: sub.creditsTotal,
    creditsUsed: sub.creditsUsed,
    currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
    isTeamMember: isTeamMember ?? false,
  });
}
