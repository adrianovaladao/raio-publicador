export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function normalize(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}

// Levenshtein distance normalised to [0,1] — 1 = identical, 0 = completely different
function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const la = a.length, lb = b.length;
  const maxLen = Math.max(la, lb);
  if (maxLen === 0) return 1;
  // For long strings (body), use a fast approximation: compare first 2000 chars
  const sa = a.slice(0, 2000), sb = b.slice(0, 2000);
  const row = Array.from({ length: sb.length + 1 }, (_, i) => i);
  for (let i = 1; i <= sa.length; i++) {
    let prev = i;
    for (let j = 1; j <= sb.length; j++) {
      const val = sa[i - 1] === sb[j - 1] ? row[j - 1] : Math.min(row[j - 1], row[j], prev) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[sb.length] = prev;
  }
  const dist = row[sb.length];
  return 1 - dist / Math.max(sa.length, sb.length);
}

// Thresholds
const TITLE_SIM    = 0.85; // ≥85% similar title is a near-duplicate
const SUBTITLE_SIM = 0.85; // ≥85% similar subtitle
const BODY_SIM     = 0.90; // ≥90% similar body

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, subtitle, body, excludeId } = await req.json() as {
    title: string; subtitle: string; body: string; excludeId?: string;
  };

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ duplicate: false });
  }

  const prisma = getPrisma();
  const existing = await prisma.release.findMany({
    where: { authorId: userId, status: { not: "CANCELLED" } },
    select: { id: true, title: true, summary: true, body: true },
  });

  const normTitle    = title.trim().toLowerCase();
  const normSubtitle = (subtitle ?? "").trim().toLowerCase();
  const normBody     = normalize(body);

  const match = existing.find(r => {
    if (excludeId && r.id === excludeId) return false;
    const rTitle    = r.title.trim().toLowerCase();
    const rSubtitle = (r.summary ?? "").trim().toLowerCase();
    const rBody     = normalize(r.body);

    const titleSim    = similarity(normTitle, rTitle);
    const subtitleSim = normSubtitle && rSubtitle ? similarity(normSubtitle, rSubtitle) : 0;
    const bodySim     = similarity(normBody, rBody);

    // Block if: body nearly identical OR (title nearly identical AND subtitle nearly identical)
    return bodySim >= BODY_SIM || (titleSim >= TITLE_SIM && subtitleSim >= SUBTITLE_SIM);
  });

  if (!match) return NextResponse.json({ duplicate: false });

  return NextResponse.json({ duplicate: true, matchId: match.id, matchTitle: match.title });
}
