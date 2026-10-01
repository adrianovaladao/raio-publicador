export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { assertMaster } from "@/lib/admin-server";

export async function GET() {
  if (!await assertMaster())
    return NextResponse.json({ count: 0 });

  const count = await getPrisma().pendingInvoice.count({
    where: { status: { in: ["PENDING", "FAILED"] } },
  });

  return NextResponse.json({ count });
}
