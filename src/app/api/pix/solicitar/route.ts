export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { PLANS, type PlanId } from "@/lib/plans";
import { sendPixPendingEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, userName, userEmail, txId } = (await req.json()) as {
    planId: PlanId;
    userName: string;
    userEmail: string;
    txId?: string;
  };

  const plan = PLANS[planId];
  if (!plan) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  if (!userName?.trim() || !userEmail?.trim()) {
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios" }, { status: 400 });
  }

  const prisma = getPrisma();

  // Verifica se já existe pagamento pendente para este usuário
  const existing = await prisma.pixPayment.findFirst({
    where: { ownerId: userId, status: "PENDING" },
  });
  if (existing) {
    return NextResponse.json({ error: "Você já tem um pagamento Pix pendente de confirmação." }, { status: 409 });
  }

  const payment = await prisma.pixPayment.create({
    data: {
      ownerId: userId,
      planId,
      amountCents: plan.priceCents,
      userName: userName.trim(),
      userEmail: userEmail.trim(),
      txId: txId?.trim() || null,
    },
  });

  // Notifica o admin por e-mail
  const adminUrl = `${req.nextUrl.origin}/admin`;
  await sendPixPendingEmail({
    paymentId: payment.id,
    userName: payment.userName,
    userEmail: payment.userEmail,
    planLabel: plan.label,
    amountCents: plan.priceCents,
    txId: payment.txId ?? undefined,
    adminUrl,
  }).catch(err => console.error("[pix/solicitar] email error:", err));

  return NextResponse.json({ ok: true, paymentId: payment.id });
}
