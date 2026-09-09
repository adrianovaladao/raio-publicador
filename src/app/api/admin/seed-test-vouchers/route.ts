// ROTA TEMPORÁRIA — remover após os testes
export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const SECRET = "raio-test-seed-2026";

const TEST_VOUCHERS = [
  { code: "TESTE-V1", credits: 50, description: "Voucher de teste #1" },
  { code: "TESTE-V2", credits: 50, description: "Voucher de teste #2" },
  { code: "TESTE-V3", credits: 50, description: "Voucher de teste #3" },
  { code: "TESTE-V4", credits: 50, description: "Voucher de teste #4" },
  { code: "TESTE-V5", credits: 50, description: "Voucher de teste #5" },
];

export async function POST(req: NextRequest) {
  const { secret } = await req.json() as { secret?: string };
  if (secret !== SECRET) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prisma = getPrisma();
  const results = [];

  for (const v of TEST_VOUCHERS) {
    const voucher = await prisma.voucher.upsert({
      where: { code: v.code },
      update: { usedCount: 0, maxUses: 3 }, // reseta usos para re-testar
      create: { ...v, maxUses: 3 },
    });
    results.push(voucher);
  }

  return NextResponse.json({ ok: true, vouchers: results.map(v => v.code) });
}
