/**
 * CRON: Renovação via Pix — DORMANT
 *
 * Este endpoint foi criado mas NÃO está ativo enquanto o pagamento via Pix
 * estiver indisponível na plataforma.
 *
 * Para ativar:
 *   1. Habilitar pagamento Pix na UI (src/app/boas-vindas/CheckoutConfirmClient.tsx)
 *   2. Setar PIX_RENEWAL_ENABLED=true nas variáveis de ambiente (Vercel)
 *   3. Adicionar entrada no vercel.json crons:
 *      { "path": "/api/cron/pix-renewal", "schedule": "0 9 * * *" }
 *   4. Garantir que CRON_SECRET está setado
 *
 * Lógica:
 *   - Roda diariamente às 9h BRT
 *   - Identifica assinantes Pix com renovação em 7, 2 ou 0 dias
 *   - Identifica assinantes sem stripeSubscriptionId (pagaram via Pix manual)
 *   - Gera nova cobrança Pix via C6 Bank
 *   - Envia e-mail com QR Code e copia-e-cola
 *   - Em caso de não pagamento em D+0+7 dias: cancela assinatura (INACTIVE)
 */
export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { PLANS, type PlanId } from "@/lib/plans";
import { criarCobranca } from "@/lib/c6bank";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { sendPixRenewalEmail } from "@/lib/email-pix";

// Guard: este cron só executa se PIX_RENEWAL_ENABLED=true estiver setado
const ENABLED = process.env.PIX_RENEWAL_ENABLED === "true";

export async function GET(req: NextRequest) {
  if (!ENABLED) {
    return NextResponse.json({ status: "dormant", message: "PIX_RENEWAL_ENABLED não está ativo" });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrisma();
  const now = new Date();

  // Encontra assinantes Pix ativos cuja renovação está em 0, 2 ou 7 dias
  // Critério: ACTIVE + sem stripeSubscriptionId (pagamento manual via Pix)
  const candidates = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      stripeSubscriptionId: null,
      currentPeriodEnd: { not: null },
    },
    select: {
      id: true,
      ownerId: true,
      plan: true,
      currentPeriodEnd: true,
    },
  });

  const clerk = await clerkClient();
  const results: { ownerId: string; daysLeft: number; sent: boolean; error?: string }[] = [];

  for (const sub of candidates) {
    if (!sub.currentPeriodEnd) continue;

    const msLeft = sub.currentPeriodEnd.getTime() - now.getTime();
    const daysLeft = Math.round(msLeft / (1000 * 60 * 60 * 24));

    // Envia apenas nos marcos de 7, 2 e 0 dias
    if (![0, 2, 7].includes(daysLeft)) continue;

    const planId = sub.plan as PlanId;
    const plan = PLANS[planId];
    if (!plan) continue;

    try {
      const user = await clerk.users.getUser(sub.ownerId);
      const email = user.emailAddresses[0]?.emailAddress;
      const firstName = user.firstName ?? email?.split("@")[0] ?? "usuário";
      if (!email) continue;

      // Gera nova cobrança Pix no C6 Bank
      // Expiração: 3 dias (permite pagamento até D+3)
      const cob = await criarCobranca({
        amountCents: plan.priceCents,
        expiracaoSegundos: 3 * 24 * 3600, // 72h
        solicitacaoPagador: `Renovação ${plan.label} — Raio Publicador`,
      });

      // Registra a cobrança no banco
      await prisma.pixPayment.create({
        data: {
          ownerId: sub.ownerId,
          planId,
          amountCents: plan.priceCents,
          userName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
          userEmail: email,
          txId: cob.txid,
          status: "PENDING",
        },
      });

      // Envia e-mail com QR Code e copia-e-cola
      await sendPixRenewalEmail(email, firstName, plan.label, plan.priceCents, sub.currentPeriodEnd, cob.pixCopiaECola, daysLeft);

      results.push({ ownerId: sub.ownerId, daysLeft, sent: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[cron/pix-renewal] Erro para ${sub.ownerId}:`, message);
      results.push({ ownerId: sub.ownerId, daysLeft, sent: false, error: message });
    }
  }

  console.log(`[cron/pix-renewal] Processados ${results.length} assinantes Pix`);
  return NextResponse.json({ processed: results.length, results });
}
