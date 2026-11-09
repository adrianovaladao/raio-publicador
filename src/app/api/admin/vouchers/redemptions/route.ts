export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { assertAnyAdmin } from "@/lib/admin-server";

// GET /api/admin/vouchers/redemptions?voucherCode=XXX
// Retorna todos os resgates de um voucher específico.
export async function GET(req: NextRequest) {
  if (!await assertAnyAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const code = req.nextUrl.searchParams.get("voucherCode");
  if (!code) return NextResponse.json({ error: "voucherCode obrigatório" }, { status: 400 });

  const prisma = getPrisma();
  const voucher = await prisma.voucher.findUnique({
    where: { code },
    include: { redemptions: { select: { userId: true, redeemedAt: true } } },
  });
  if (!voucher) return NextResponse.json({ error: "Voucher não encontrado" }, { status: 404 });
  if (voucher.redemptions.length === 0) return NextResponse.json({ voucher: code, redemptions: [] });

  const clerk = await clerkClient();
  const userIds = voucher.redemptions.map(r => r.userId);
  const clerkUsers = await clerk.users.getUserList({ limit: 500 });
  const clerkMap = new Map(clerkUsers.data.filter(u => userIds.includes(u.id)).map(u => [u.id, u]));

  const rows = voucher.redemptions.map(r => {
    const u = clerkMap.get(r.userId);
    return {
      userId:    r.userId,
      email:     u?.emailAddresses[0]?.emailAddress ?? "—",
      name:      [u?.firstName, u?.lastName].filter(Boolean).join(" ") || "—",
      redeemedAt: r.redeemedAt.toISOString(),
    };
  });

  return NextResponse.json({ voucher: code, redemptions: rows });
}
