export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isAnyAdmin } from "@/lib/admin";

// Correções de location: id → valor correto
const FIXES: Record<string, string> = {
  // Paranoá em Pauta estava "PR" (Paraná), mas Paranoá fica no DF
  "cmrjucz6s000z04k2r6hnw994": "DF",
};

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = await currentUser();
  if (!isAnyAdmin(me?.publicMetadata as Record<string, unknown>))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prisma = getPrisma();
  const results: { id: string; name: string; from: string | null; to: string }[] = [];

  for (const [id, location] of Object.entries(FIXES)) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id }, select: { id: true, name: true, location: true } });
    if (!vehicle) { results.push({ id, name: "NOT FOUND", from: null, to: location }); continue; }
    await prisma.vehicle.update({ where: { id }, data: { location } });
    results.push({ id, name: vehicle.name, from: vehicle.location, to: location });
  }

  return NextResponse.json({ ok: true, fixed: results });
}
