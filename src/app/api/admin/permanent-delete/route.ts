// Endpoint interno: deleta releases permanentemente do banco (apenas para releases já arquivados).
// Protegido pelo FEED_TOKEN.
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const token = req.headers.get("x-feed-token") ?? new URL(req.url).searchParams.get("token");
  const body = await req.json() as { releaseIds: string[] };

  const validTokens = Object.entries(process.env)
    .filter(([k]) => k.startsWith("FEED_TOKEN_"))
    .map(([, v]) => v);

  if (!token || !validTokens.includes(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!Array.isArray(body.releaseIds) || body.releaseIds.length === 0) {
    return NextResponse.json({ error: "releaseIds é obrigatório" }, { status: 400 });
  }

  const prisma = getPrisma();

  // Só permite deletar releases já arquivados (archivedAt != null)
  const releases = await prisma.release.findMany({
    where: { id: { in: body.releaseIds }, archivedAt: { not: null } },
    select: { id: true, title: true },
  });

  if (releases.length === 0) {
    return NextResponse.json({ error: "Nenhum release arquivado encontrado com esses IDs" }, { status: 404 });
  }

  const ids = releases.map(r => r.id);
  await prisma.release.deleteMany({ where: { id: { in: ids } } });

  return NextResponse.json({ ok: true, deleted: releases });
}
