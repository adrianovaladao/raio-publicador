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
      max_tokens: 500,
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
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 500 } }),
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
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude error ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

// ─── SerpAPI — AI Overview do Google ─────────────────────────────────────────

type SerpAIOverview = {
  text?: string;
  sources?: Array<{ title?: string; link?: string; domain?: string }>;
};

async function checkGoogleAIOverview(keyword: string, companyName: string): Promise<{ found: boolean; excerpt: string; error?: string }> {
  const key = process.env.SERPAPI_KEY;
  if (!key) return { found: false, excerpt: "", error: "SERPAPI_KEY não configurada" };

  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(keyword)}&api_key=${key}&hl=pt-br&gl=br&num=10`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`SerpAPI error ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const overview: SerpAIOverview | undefined = data.ai_overview;

  if (!overview) return { found: false, excerpt: "" };

  const text = overview.text ?? "";
  const name = companyName.toLowerCase();
  const found = text.toLowerCase().includes(name);

  if (!found) return { found: false, excerpt: "" };

  const idx = text.toLowerCase().indexOf(name);
  const start = Math.max(0, idx - 100);
  const end = Math.min(text.length, idx + name.length + 100);
  return { found: true, excerpt: "…" + text.slice(start, end).trim() + "…" };
}

function checkMention(text: string, companyName: string): { found: boolean; excerpt: string } {
  const lower = text.toLowerCase();
  const name  = companyName.toLowerCase();
  const found = lower.includes(name);
  if (!found) return { found: false, excerpt: "" };
  const idx   = lower.indexOf(name);
  const start = Math.max(0, idx - 80);
  const end   = Math.min(text.length, idx + name.length + 80);
  return { found: true, excerpt: "…" + text.slice(start, end).trim() + "…" };
}

// ─── POST /api/visibility-check ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { companyName, segment, keyword } = await req.json() as {
    companyName: string; segment: string; keyword: string;
  };
  if (!companyName?.trim() || !segment?.trim())
    return NextResponse.json({ error: "Nome e segmento obrigatórios" }, { status: 400 });
  if (!keyword?.trim())
    return NextResponse.json({ error: "Palavra-chave obrigatória" }, { status: 400 });

  const prisma = getPrisma();

  const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });
  if (!sub || sub.status !== "ACTIVE")
    return NextResponse.json({ error: "Assinatura ativa necessária" }, { status: 403 });

  const periodStart = sub.currentPeriodStart ?? new Date(0);
  const usedThisPeriod = await prisma.visibilityCheck.count({
    where: { userId, createdAt: { gte: periodStart }, creditsUsed: 0 },
  });

  let creditsUsed = 0;
  if (usedThisPeriod >= FREE_CHECKS_PER_MONTH) {
    if ((sub.creditsTotal - sub.creditsUsed) < CREDITS_PER_EXTRA)
      return NextResponse.json({ error: "Créditos insuficientes. São necessários 50 créditos para verificações adicionais." }, { status: 402 });
    creditsUsed = CREDITS_PER_EXTRA;
  }

  // Não menciona o nome da marca — verifica se ela aparece organicamente
  const prompt = `Sobre o tema "${keyword}", quais são as principais empresas, marcas ou organizações que você considera referências? Liste pelo menos 5 nomes específicos que você conhece nesse contexto. Seja direto e mencione apenas nomes reais.`;

  // Consultar todas as fontes em paralelo
  const [openaiText, geminiText, claudeText, geoResult] = await Promise.allSettled([
    askOpenAI(prompt),
    askGemini(prompt),
    askClaude(prompt),
    checkGoogleAIOverview(keyword, companyName),
  ]);

  const results = {
    openai: openaiText.status === "fulfilled"
      ? checkMention(openaiText.value, companyName)
      : { found: false, excerpt: "", error: "Falha na consulta" },
    gemini: geminiText.status === "fulfilled"
      ? checkMention(geminiText.value, companyName)
      : { found: false, excerpt: "", error: (geminiText as PromiseRejectedResult).reason?.message ?? "Falha na consulta" },
    claude: claudeText.status === "fulfilled"
      ? checkMention(claudeText.value, companyName)
      : { found: false, excerpt: "", error: "Falha na consulta" },
    googleAI: geoResult.status === "fulfilled"
      ? geoResult.value
      : { found: false, excerpt: "", error: (geoResult as PromiseRejectedResult).reason?.message ?? "Falha na consulta" },
  };

  await prisma.$transaction([
    prisma.visibilityCheck.create({
      data: {
        userId,
        companyName: companyName.trim(),
        segment: segment.trim(),
        city: keyword.trim(), // reaproveitando campo city para keyword até migrar schema
        results,
        creditsUsed,
      },
    }),
    ...(creditsUsed > 0 ? [
      prisma.subscription.update({
        where: { ownerId: userId },
        data: { creditsUsed: { increment: creditsUsed } },
      }),
    ] : []),
  ]);

  const foundCount = Object.values(results).filter(r => r.found).length;
  const totalEngines = 4;

  return NextResponse.json({
    results,
    foundCount,
    totalEngines,
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
