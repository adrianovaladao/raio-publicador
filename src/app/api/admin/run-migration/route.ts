export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { assertAnyAdmin } from "@/lib/admin-server";

export async function POST(req: NextRequest) {
  if (!await assertAnyAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const secret = req.headers.get("x-migration-secret");
  if (secret !== process.env.PROVISION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrisma();
  const results: string[] = [];

  try {
    await prisma.$executeRawUnsafe(`CREATE TYPE "PixPaymentType" AS ENUM ('SUBSCRIPTION', 'CREDIT_PURCHASE')`);
    results.push("✓ CREATE TYPE PixPaymentType");
  } catch (e) { results.push(`⚠ CREATE TYPE: ${e instanceof Error ? e.message : e}`); }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "PixPayment" ADD COLUMN "type" "PixPaymentType" NOT NULL DEFAULT 'SUBSCRIPTION'`);
    results.push("✓ ADD COLUMN type");
  } catch (e) { results.push(`⚠ ADD COLUMN type: ${e instanceof Error ? e.message : e}`); }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "PixPayment" ADD COLUMN "creditQty" INTEGER`);
    results.push("✓ ADD COLUMN creditQty");
  } catch (e) { results.push(`⚠ ADD COLUMN creditQty: ${e instanceof Error ? e.message : e}`); }

  return NextResponse.json({ ok: true, results });
}
