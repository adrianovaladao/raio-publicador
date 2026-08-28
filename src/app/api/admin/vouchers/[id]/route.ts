export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { assertAnyAdmin } from "@/lib/admin-server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAnyAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await getPrisma().voucher.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
