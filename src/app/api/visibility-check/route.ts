export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const FREE_CHECKS_PER_MONTH = 3;
const CREDITS_PER_EXTRA     = 50;

// ─── Helpers de IA ────────────────────────────────────────────────────────────

async function askOpenAI(prompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function askGemini(prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 400 } }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini error ${res.status}: ${JSON.stringify(err)}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function askClaude(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude error ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

function checkMention(text: string, companyName: string): { found: boolean; excerpt: string } {
  const lower = text.toLowerCase();
  const name  = companyName.toLowerCase();
  const found = lower.includes(name);
  if (!found) return { found: false, excerpt: "" };
  const idx     = lower.indexOf(name);
  const start   = Math.max(0, idx - 80);
  const end     = Math.min(text.length, idx + name.length + 80);
  return { found: true, excerpt: "…" + text.slice(start, end).trim() + "…" };
}

// ─── POST /api/visibility-check ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { companyName, segment, city } = await req.json() as {
    companyName: string; segment: string; city?: string;
  };
  if (!companyName?.trim() || !segment?.trim())
    return NextResponse.json({ error: "Nome e segmento obrigatórios" }, { status: 400 });

  const prisma = getPrisma();

  // ── Verificar limite mensal ───────────────────────────────────────────────
  const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });
  if (!sub || sub.status !== "ACTIVE")
    return NextResponse.json({ error: "Assinatura ativa necessária" }, { status: 403 });

  const periodStart = sub.currentPeriodStart ?? new Date(0);
  const usedThisPeriod = await prisma.visibilityCheck.count({
    where: { userId, createdAt: { gte: periodStart }, creditsUsed: 0 },
  });

  let creditsUsed = 0;
  if (usedThisPeriod >= FREE_CHECKS_PER_MONTH) {
    // Cobrar créditos
    if ((sub.creditsTotal - sub.creditsUsed) < CREDITS_PER_EXTRA)
      return NextResponse.json({ error: "Créditos insuficientes. São necessários 50 créditos para verificações adicionais." }, { status: 402 });
    creditsUsed = CREDITS_PER_EXTRA;
  }

  // ── Montar prompt ─────────────────────────────────────────────────────────
  const location = city?.trim() ? ` em ${city.trim()}` : " no Brasil";
  const prompt = `Quais são as melhores empresas de ${segment}${location}? Liste pelo menos 5 nomes específicos de empresas reais que você conhece nesse segmento. Seja direto e mencione apenas nomes de empresas.`;

  // ── Consultar IAs em paralelo ─────────────────────────────────────────────
  const [openaiText, geminiText, claudeText] = await Promise.allSettled([
    askOpenAI(prompt),
    askGemini(prompt),
    askClaude(prompt),
  ]);

  const results = {
    openai: openaiText.status === "fulfilled"
      ? checkMention(openaiText.value, companyName)
      : { found: false, excerpt: "", error: "Falha na consulta" },
    gemini: geminiText.status === "fulfilled"
      ? checkMention(geminiText.value, companyName)
      : { found: false, excerpt: "", error: "Falha na consulta" },
    claude: claudeText.status === "fulfilled"
      ? checkMention(claudeText.value, companyName)
      : { found: false, excerpt: "", error: "Falha na consulta" },
  };

  // ── Salvar resultado e debitar créditos ───────────────────────────────────
  await prisma.$transaction([
    prisma.visibilityCheck.create({
      data: { userId, companyName: companyName.trim(), segment: segment.trim(), city: city?.trim() || null, results, creditsUsed },
    }),
    ...(creditsUsed > 0 ? [
      prisma.subscription.update({
        where: { ownerId: userId },
        data: { creditsUsed: { increment: creditsUsed } },
      }),
    ] : []),
  ]);

  const foundCount = Object.values(results).filter(r => r.found).length;

  return NextResponse.json({
    results,
    foundCount,
    totalEngines: 3,
    freeChecksUsed: creditsUsed === 0 ? usedThisPeriod + 1 : usedThisPeriod,
    freeChecksTotal: FREE_CHECKS_PER_MONTH,
    creditsUsed,
  });
}

// ─── GET /api/visibility-check — histórico ────────────────────────────────────

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const prisma = getPrisma();
  const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });
  const periodStart = sub?.currentPeriodStart ?? new Date(0);

  const [checks, freeUsed] = await Promise.all([
    prisma.visibilityCheck.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.visibilityCheck.count({
      where: { userId, createdAt: { gte: periodStart }, creditsUsed: 0 },
    }),
  ]);

  return NextResponse.json({
    checks,
    freeChecksUsed: freeUsed,
    freeChecksTotal: FREE_CHECKS_PER_MONTH,
  });
}
