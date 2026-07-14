export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function normalize(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, subtitle, body, excludeId } = await req.json() as {
    title: string; subtitle: string; body: string; excludeId?: string;
  };

  if (!title?.trim() || !subtitle?.trim() || !body?.trim()) {
    return NextResponse.json({ duplicate: false });
  }

  const prisma = getPrisma();
  const existing = await prisma.release.findMany({
    where: { authorId: userId, status: { not: "CANCELLED" } },
    select: { id: true, title: true, summary: true, body: true },
  });

  const normTitle    = title.trim().toLowerCase();
  const normSubtitle = subtitle.trim().toLowerCase();
  const normBody     = normalize(body);

  const match = existing.find(r => {
    if (excludeId && r.id === excludeId) return false;
    return (
      r.title.trim().toLowerCase()     === normTitle    &&
      (r.summary ?? "").trim().toLowerCase() === normSubtitle &&
      normalize(r.body)                === normBody
    );
  });

  if (!match) return NextResponse.json({ duplicate: false });

  return NextResponse.json({ duplicate: true, matchId: match.id, matchTitle: match.title });
}
