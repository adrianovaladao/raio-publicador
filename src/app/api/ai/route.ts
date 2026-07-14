export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const AI_CREDIT_COST = 25;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const sub = await prisma.subscription.findUnique({
    where: { ownerId: userId },
    select: { creditsTotal: true, creditsUsed: true, status: true },
  });

  if (!sub || ["PAST_DUE", "CANCELLED"].includes(sub.status)) {
    return NextResponse.json({ error: "Assinatura suspensa. Regularize seu plano para usar a IA." }, { status: 403 });
  }

  const available = sub.creditsTotal - sub.creditsUsed;
  if (available < AI_CREDIT_COST) {
    return NextResponse.json(
      { error: `Créditos insuficientes. Esta ação custa ${AI_CREDIT_COST} créditos e você tem ${available} disponíveis.` },
      { status: 402 }
    );
  }

  const { title, subtitle, body, brandName, mode, direction, tone } = await req.json() as {
    title?: string;
    subtitle?: string;
    body?: string;
    brandName?: string;
    mode?: "generate" | "rewrite" | "summarize" | "tone";
    direction?: string;
    tone?: string;
  };

  const toneLabel = tone === "institucional" ? "institucional e formal" : tone === "descontraido" ? "descontraído e acessível" : "jornalístico e objetivo";
  const directionBlock = direction?.trim() ? `\nOrientação adicional do usuário: ${direction.trim()}` : "";
  const ctx = `Marca: ${brandName ?? "não informada"} · Título: ${title ?? ""} · Subtítulo: ${subtitle ?? ""}`;

  let prompt: string;
  if (mode === "rewrite") {
    prompt = `Você é um redator especialista em assessoria de imprensa. Reescreva e aprimore APENAS o trecho abaixo, mantendo as informações essenciais. Tom desejado: ${toneLabel}.${directionBlock}

Contexto — ${ctx}

Trecho a reescrever:
${body}

Retorne apenas o trecho reescrito, sem comentários, introdução ou explicações. Texto puro, sem markdown.`;
  } else if (mode === "summarize") {
    prompt = `Você é um redator especialista em assessoria de imprensa. Resuma o texto abaixo em 2-3 parágrafos concisos, preservando os pontos mais importantes. Tom desejado: ${toneLabel}.${directionBlock}

Contexto — ${ctx}

Texto:
${body}

Retorne apenas o resumo, sem comentários. Texto puro, sem markdown.`;
  } else if (mode === "tone") {
    prompt = `Você é um redator especialista em assessoria de imprensa. Ajuste o tom do texto abaixo para ${toneLabel}, sem alterar as informações ou a estrutura.${directionBlock}

Contexto — ${ctx}

Texto:
${body}

Retorne apenas o texto com o tom ajustado, sem comentários. Texto puro, sem markdown.`;
  } else {
    prompt = `Você é um redator especialista em assessoria de imprensa. Escreva um release profissional completo. Tom desejado: ${toneLabel}.${directionBlock}

${ctx}

Escreva com lide (quem, o quê, quando, onde, por quê) seguido de 3-4 parágrafos de desenvolvimento. O texto deve ter entre 500 e 600 palavras. Texto puro com parágrafos separados por linhas em branco, sem markdown.`;
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("");

    // Convert plain text paragraphs to minimal HTML for Tiptap
    const html = text
      .split(/\n\n+/)
      .map(p => `<p>${p.trim().replace(/\n/g, "<br>")}</p>`)
      .join("");

    const updated = await prisma.subscription.update({
      where: { ownerId: userId },
      data: { creditsUsed: { increment: AI_CREDIT_COST } },
      select: { creditsUsed: true, creditsTotal: true },
    });

    console.log(`[ai] debitou ${AI_CREDIT_COST} créditos de ${userId} — novo saldo: ${updated.creditsTotal - updated.creditsUsed}`);

    return NextResponse.json({ text: html, creditsDebited: AI_CREDIT_COST, creditsRemaining: updated.creditsTotal - updated.creditsUsed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
