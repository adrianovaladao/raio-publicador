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
  const count = await prisma.pixPayment.count({ where: { status: "PENDING" } });
  return NextResponse.json({ count });
}
