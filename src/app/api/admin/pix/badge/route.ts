export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { assertAnyAdmin } from "@/lib/admin-server";
import { NextResponse } from "next/server";

// Badge sidebar: pendentes de confirmação + reembolsos Pix ainda não processados
export async function GET() {
  if (!await assertAnyAdmin()) {
    return NextResponse.json({ count: 0 });
  }

  const prisma = getPrisma();

  // Assinaturas canceladas (precisam de reembolso Pix)
  const cancelledSubs = await prisma.subscription.findMany({
    where: { status: "CANCELLED" },
    select: { ownerId: true },
  });
  const cancelledOwnerIds = cancelledSubs.map(s => s.ownerId);

  const [pending, refundPending] = await Promise.all([
    prisma.pixPayment.count({ where: { status: "PENDING" } }),
    cancelledOwnerIds.length > 0
      ? prisma.pixPayment.count({
          where: {
            ownerId: { in: cancelledOwnerIds },
            status: "CONFIRMED",
          },
        })
      : Promise.resolve(0),
  ]);

  return NextResponse.json({ count: pending + refundPending });
}
