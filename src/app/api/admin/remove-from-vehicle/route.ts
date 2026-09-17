// Endpoint interno temporário: remove um veículo do array de veículos de releases específicos.
// Protegido pelo FEED_TOKEN do veículo informado.
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const token = req.headers.get("x-feed-token") ?? new URL(req.url).searchParams.get("token");
  const body = await req.json() as { vehicleId: string; releaseIds: string[] };

  // Valida token contra todos os FEED_TOKEN_* do env
  const validTokens = Object.entries(process.env)
    .filter(([k]) => k.startsWith("FEED_TOKEN_"))
    .map(([, v]) => v);

  if (!token || !validTokens.includes(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!body.vehicleId || !Array.isArray(body.releaseIds) || body.releaseIds.length === 0) {
    return NextResponse.json({ error: "vehicleId e releaseIds são obrigatórios" }, { status: 400 });
  }

  const prisma = getPrisma();
  const results: { id: string; before: string[]; after: string[] }[] = [];

  for (const id of body.releaseIds) {
    const r = await prisma.release.findUnique({ where: { id }, select: { vehicles: true } });
    if (!r) { results.push({ id, before: [], after: [] }); continue; }
    const after = (r.vehicles as string[]).filter(v => v !== body.vehicleId);
    await prisma.release.update({ where: { id }, data: { vehicles: after } });
    results.push({ id, before: r.vehicles as string[], after });
  }

  return NextResponse.json({ ok: true, results });
}
