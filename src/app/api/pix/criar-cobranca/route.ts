export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { PLANS, type PlanId } from "@/lib/plans";
import { criarCobranca } from "@/lib/c6bank";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clerkUser = await currentUser();

  const { planId } = (await req.json()) as { planId: PlanId };
  const plan = PLANS[planId];
  if (!plan) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });

  const prisma = getPrisma();

  // Se já existe uma cobrança PENDING ativa para este usuário, reutiliza
  const existing = await prisma.pixPayment.findFirst({
    where: { ownerId: userId, planId, status: "PENDING" },
  });
  if (existing?.txId) {
    // Retorna o mesmo txId — o frontend fará polling normalmente
    // (QR Code precisa ser recriado pois pixCopiaECola não é armazenado)
    // Recria a cobrança no C6 com o mesmo txId para obter o pixCopiaECola
  }

  try {
    const cob = await criarCobranca({
      amountCents: plan.priceCents,
      expiracaoSegundos: 3600,
      solicitacaoPagador: `Plano ${plan.label} — Raio Publicador`,
    });

    // Persiste o registro vinculando txId → ownerId + planId
    await prisma.pixPayment.create({
      data: {
        ownerId:    userId,
        planId,
        amountCents: plan.priceCents,
        userName:   clerkUser ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() : "",
        userEmail:  clerkUser?.emailAddresses?.[0]?.emailAddress ?? "",
        txId:       cob.txid,
        status:     "PENDING",
      },
    });

    return NextResponse.json({
      txId:         cob.txid,
      pixCopiaECola: cob.pixCopiaECola,
      location:     cob.location,
      expiresIn:    cob.calendario.expiracao,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("[pix/criar-cobranca]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
