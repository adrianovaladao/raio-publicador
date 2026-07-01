export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";
import { SUPPORT_KNOWLEDGE } from "@/lib/support-knowledge";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, conversationId } = await req.json() as { message: string; conversationId?: string };
  if (!message?.trim()) return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });

  const prisma = getPrisma();

  // Get or create conversation
  let conv = conversationId
    ? await prisma.supportConversation.findFirst({ where: { id: conversationId, ownerId: userId }, include: { messages: { orderBy: { createdAt: "asc" } } } })
    : null;

  if (!conv) {
    conv = await prisma.supportConversation.create({
      data: { ownerId: userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  // Save user message
  await prisma.supportMessage.create({
    data: { conversationId: conv.id, role: "user", content: message },
  });

  // Build message history for Claude (last 20 messages)
  const history = conv.messages.slice(-20).map(m => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  history.push({ role: "user", content: message });

  // Get plan for context
  const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });
  const plan = sub ? PLANS[sub.plan as keyof typeof PLANS] : null;
  const planLabel = plan?.label ?? "desconhecido";
  const hasHumanSupport = sub?.plan === "ADVANCED" || sub?.plan === "PROFESSIONAL";

  const systemPrompt = `${SUPPORT_KNOWLEDGE}

CONTEXTO DO USUÁRIO ATUAL:
- Plano: ${planLabel}
- Suporte humano disponível: ${hasHumanSupport ? "sim (Avançado/Profissional)" : "não (Básico — apenas tickets)"}`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: systemPrompt,
      messages: history,
    });

    const reply = response.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("");

    await prisma.supportMessage.create({
      data: { conversationId: conv.id, role: "assistant", content: reply },
    });

    return NextResponse.json({ reply, conversationId: conv.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await getPrisma().supportConversation.findMany({
    where: { ownerId: userId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      ticket: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(conversations);
}
