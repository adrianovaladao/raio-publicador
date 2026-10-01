export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { assertMaster } from "@/lib/admin-server";

export async function PATCH(req: NextRequest) {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { ownerId, invoiced } = await req.json() as { ownerId: string; invoiced: boolean };
  if (!ownerId)
    return NextResponse.json({ error: "ownerId obrigatório" }, { status: 400 });

  await getPrisma().subscription.update({
    where: { ownerId },
    data: { invoicedAt: invoiced ? new Date() : null },
  });

  return NextResponse.json({ ok: true });
}
