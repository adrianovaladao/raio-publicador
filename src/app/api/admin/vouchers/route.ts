export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { assertAnyAdmin } from "@/lib/admin-server";

export async function GET() {
  if (!await assertAnyAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const vouchers = await getPrisma().voucher.findMany({
      select: {
        id: true,
        code: true,
        credits: true,
        maxUses: true,
        usedCount: true,
        description: true,
        expiresAt: true,
        archivedAt: true,
        createdAt: true,
        _count: { select: { redemptions: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(vouchers);
  } catch (err) {
    // Fallback: se archivedAt ainda não existe no banco, busca sem esse campo
    console.warn("[vouchers GET] Tentando fallback sem archivedAt:", String(err));
    try {
      const vouchers = await getPrisma().voucher.findMany({
        select: {
          id: true,
          code: true,
          credits: true,
          maxUses: true,
          usedCount: true,
          description: true,
          expiresAt: true,
          createdAt: true,
          _count: { select: { redemptions: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      // Injeta archivedAt: null para compatibilidade com a UI
      return NextResponse.json(vouchers.map(v => ({ ...v, archivedAt: null })));
    } catch (err2) {
      console.error("[vouchers GET] Erro Prisma fallback:", err2);
      return NextResponse.json({ error: String(err2) }, { status: 500 });
    }
  }
}

export async function POST(req: Request) {
  if (!await assertAnyAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { code, credits, maxUses, description, expiresAt } = await req.json() as {
    code: string; credits: number; maxUses?: number; description?: string; expiresAt?: string;
  };

  if (!code?.trim() || !credits || credits < 1)
    return NextResponse.json({ error: "Código e créditos são obrigatórios." }, { status: 400 });

  const voucher = await getPrisma().voucher.create({
    data: {
      code:        code.trim().toUpperCase(),
      credits,
      maxUses:     maxUses ?? 1,
      description: description?.trim() || null,
      expiresAt:   expiresAt ? new Date(expiresAt) : null,
    },
  });

  return NextResponse.json(voucher, { status: 201 });
}
