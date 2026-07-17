export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim().toUpperCase();
  if (!code) return NextResponse.json({ valid: false, error: "Código inválido." });

  const voucher = await getPrisma().voucher.findUnique({ where: { code } });
  if (!voucher) return NextResponse.json({ valid: false, error: "Código não encontrado." });
  if (voucher.expiresAt && voucher.expiresAt < new Date())
    return NextResponse.json({ valid: false, error: "Este código expirou." });
  if (voucher.usedCount >= voucher.maxUses)
    return NextResponse.json({ valid: false, error: "Este código já atingiu o limite de usos." });

  return NextResponse.json({ valid: true, credits: Math.min(voucher.credits, 100) });
}
