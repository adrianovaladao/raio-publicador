export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { criarCobranca } from "@/lib/c6bank";
import { NextRequest, NextResponse } from "next/server";

// Preço por crédito em centavos por plano (espelha BuyCreditsModal)
const CREDIT_PRICE_CENTS: Record<string, number> = {
  BASIC:        500,
  ADVANCED:     300,
  PROFESSIONAL: 250,
  VOUCHER:      500,
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clerkUser = await currentUser();

  const { quantity, planId } = (await req.json()) as { quantity: number; planId: string };
  if (!quantity || quantity < 1) return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });

  const prisma = getPrisma();
  const sub = await prisma.subscription.findUnique({ where: { ownerId: userId }, select: { plan: true } });
  const effectivePlan = planId ?? sub?.plan ?? "BASIC";
  const pricePerCr = CREDIT_PRICE_CENTS[effectivePlan] ?? 500;
  const amountCents = Math.round(quantity * pricePerCr);

  // Cancela cobranças PENDING anteriores para o mesmo usuário/quantidade
  await prisma.pixPayment.updateMany({
    where: { ownerId: userId, type: "CREDIT_PURCHASE", creditQty: quantity, status: "PENDING" },
    data: { status: "REJECTED" },
  });

  try {
    const cob = await criarCobranca({
      amountCents,
      expiracaoSegundos: 3600,
      solicitacaoPagador: `${quantity} créditos avulsos — Raio Publicador`,
    });

    await prisma.pixPayment.create({
      data: {
        ownerId:    userId,
        planId:     effectivePlan,
        amountCents,
        userName:   clerkUser ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() : "",
        userEmail:  clerkUser?.emailAddresses?.[0]?.emailAddress ?? "",
        txId:       cob.txid,
        status:     "PENDING",
        type:       "CREDIT_PURCHASE",
        creditQty:  quantity,
      },
    });

    return NextResponse.json({
      txId:          cob.txid,
      pixCopiaECola: cob.pixCopiaECola,
      location:      cob.location,
      expiresIn:     cob.calendario.expiracao,
      amountCents,
      quantity,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("[pix/criar-cobranca-creditos]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
