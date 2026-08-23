export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { PLANS, type PlanId } from "@/lib/plans";
import { NextRequest, NextResponse } from "next/server";

/**
 * Webhook do C6 Bank — recebe notificações de pagamentos Pix confirmados.
 * Payload esperado:
 * {
 *   external_id: string,   // txid da cobrança
 *   status: "PAID",
 *   service: "PIX",
 *   information: string,   // JSON stringificado com dados da transação
 *   client_id: string,
 *   ...
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      external_id?: string;
      status?: string;
      service?: string;
      information?: string;
    };

    console.log("[webhook/c6bank]", JSON.stringify(body));

    // Só processa PIX pago
    if (body.service !== "PIX" || body.status !== "PAID") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const txId = body.external_id;
    if (!txId) return NextResponse.json({ error: "txId ausente" }, { status: 400 });

    const prisma = getPrisma();

    // Busca o PixPayment pelo txId
    const payment = await prisma.pixPayment.findFirst({
      where: { txId, status: "PENDING" },
    });

    if (!payment) {
      // Pode já ter sido processado — retorna 200 para o C6 não retentar
      console.warn(`[webhook/c6bank] txId ${txId} não encontrado ou já processado`);
      return NextResponse.json({ ok: true });
    }

    const plan = PLANS[payment.planId as PlanId];
    if (!plan) {
      console.error(`[webhook/c6bank] plano inválido: ${payment.planId}`);
      return NextResponse.json({ error: "plano inválido" }, { status: 400 });
    }

    // Ativa a assinatura
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const sub = await prisma.subscription.findUnique({ where: { ownerId: payment.ownerId } });

    if (sub) {
      await prisma.subscription.update({
        where: { ownerId: payment.ownerId },
        data: {
          plan: payment.planId as PlanId,
          status: "ACTIVE",
          creditsTotal: plan.credits,
          creditsUsed: 0,
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          ownerId: payment.ownerId,
          plan: payment.planId as PlanId,
          status: "ACTIVE",
          creditsTotal: plan.credits,
          creditsUsed: 0,
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
        },
      });
    }

    // Marca pagamento como confirmado
    await prisma.pixPayment.update({
      where: { id: payment.id },
      data: { status: "CONFIRMED", confirmedAt: now, confirmedBy: "c6bank-webhook" },
    });

    console.log(`[webhook/c6bank] assinatura ativada: ${payment.ownerId} → ${payment.planId}`);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("[webhook/c6bank]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
