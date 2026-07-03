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

  if (!sub || ["PAST_DUE", "CANCELLED", "INACTIVE"].includes(sub.status)) {
    return NextResponse.json({ error: "Assinatura inativa." }, { status: 403 });
  }

  const available = sub.creditsTotal - sub.creditsUsed;
  if (available < AI_CREDIT_COST) {
    return NextResponse.json(
      { error: `Créditos insuficientes. Esta ação custa ${AI_CREDIT_COST} créditos e você tem ${available} disponíveis.` },
      { status: 402 }
    );
  }

  const { title, subtitle, body, brandName, mode } = await req.json() as {
    title?: string;
    subtitle?: string;
    body?: string;
    brandName?: string;
    mode?: "generate" | "rewrite";
  };

  const prompt = mode === "rewrite"
    ? `Você é um redator especialista em assessoria de imprensa. Reescreva e aprimore APENAS o trecho abaixo, mantendo as informações essenciais mas tornando-o mais profissional, objetivo e atrativo para jornalistas. Não adicione informações que não estejam no trecho original.

Contexto — Marca: ${brandName ?? "não informada"} · Título: ${title ?? ""} · Subtítulo: ${subtitle ?? ""}

Trecho a reescrever:
${body}

Retorne apenas o trecho reescrito, sem comentários, introdução ou explicações. Texto puro, sem markdown.`
    : `Você é um redator especialista em assessoria de imprensa. Escreva um release profissional completo para a seguinte informação:

Marca: ${brandName ?? "não informada"}
Título: ${title ?? "não informado"}
Subtítulo: ${subtitle ?? "não informado"}

Escreva com lide (quem, o quê, quando, onde, por quê) seguido de 3-4 parágrafos de desenvolvimento. O texto deve ter entre 500 e 600 palavras. Use linguagem jornalística, objetiva e profissional. Texto puro com parágrafos separados por linhas em branco, sem markdown.`;

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

    await prisma.subscription.update({
      where: { ownerId: userId },
      data: { creditsUsed: { increment: AI_CREDIT_COST } },
    });

    return NextResponse.json({ text: html, creditsDebited: AI_CREDIT_COST });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
