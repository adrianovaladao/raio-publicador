export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { assertMaster } from "@/lib/admin-server";

/**
 * POST /api/admin/nfse/manual
 *
 * Cria um PendingInvoice manualmente (status PENDING).
 * A emissão é feita pelo painel /admin/nfse clicando em "Emitir".
 * Usado para compras que ocorreram antes do fix de geração automática.
 *
 * Body: { clerkId: string; amountCents: number }
 */
export async function POST(req: NextRequest) {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { clerkId, amountCents } =
    await req.json() as { clerkId: string; amountCents: number };

  if (!clerkId || !amountCents || amountCents <= 0)
    return NextResponse.json({ error: "clerkId e amountCents obrigatórios" }, { status: 400 });

  const prisma = getPrisma();
  const clerk = await clerkClient();

  const [fiscal] = await Promise.all([
    prisma.fiscalProfile.findUnique({ where: { ownerId: clerkId } }),
    clerk.users.getUser(clerkId),
  ]);

  if (!fiscal)
    return NextResponse.json({ error: "Perfil fiscal não encontrado para este usuário" }, { status: 422 });

  // Cria o PendingInvoice sem stripeInvoiceId (compra manual)
  // A emissão é feita manualmente pelo painel /admin/nfse
  const inv = await prisma.pendingInvoice.create({
    data: {
      clerkId,
      amountCents,
      scheduledFor: new Date(),
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true, pendingInvoiceId: inv.id });
}
