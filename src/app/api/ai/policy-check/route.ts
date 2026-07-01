export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, subtitle, body } = await req.json() as {
    title?: string;
    subtitle?: string;
    body?: string;
  };

  const prompt = `Você é um editor especialista em política editorial de branded content para veículos de comunicação. Analise o release abaixo e identifique APENAS pontos que violam as regras a seguir. Não elogie, não parabenize — só aponte problemas reais.

REGRAS DE POLÍTICA EDITORIAL:

1. VERACIDADE: Dados estatísticos, pesquisas, estudos, rankings e premiações devem ter fonte identificada (nome da pesquisa, instituição responsável, data e metodologia).
2. CITAÇÃO DE TERCEIROS: Menção a empresas, marcas, clientes, parceiros, fornecedores ou pessoas físicas exige autorização prévia. Sem autorização, usar apenas referências genéricas.
3. CITAÇÃO DE CONCORRENTES: Não é permitida menção direta a concorrentes ou comparações com outras empresas do mesmo segmento.
4. MENÇÃO A VEÍCULOS DE COMUNICAÇÃO: Não são permitidas referências promocionais ou citações a outros veículos de comunicação (ex: "segundo a Folha de S.Paulo", "conforme reportou a Veja").
5. LINGUAGEM EDITORIAL: Evitar excesso de adjetivos, superlativos ("o melhor", "o maior", "líder absoluto"), slogans e mensagens puramente promocionais sem comprovação.
6. IMAGENS: Não mencionar imagens sem crédito de autoria ou origem. Imagens sem licença ou com marca d'água não são aceitas.
7. LINKS: Máximo 2 links externos por release.

RELEASE:
Título: ${title ?? ""}
Subtítulo: ${subtitle ?? ""}
Corpo: ${body ? body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : ""}

Responda EXCLUSIVAMENTE em JSON com esta estrutura (sem markdown, sem texto antes ou depois):
{
  "ok": true | false,
  "issues": [
    {
      "rule": "nome curto da regra violada",
      "severity": "error" | "warning",
      "description": "descrição clara do problema encontrado no texto",
      "suggestion": "sugestão objetiva de como corrigir"
    }
  ]
}

Se não houver nenhum problema, retorne {"ok": true, "issues": []}.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("")
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");

    const json = JSON.parse(raw);
    return NextResponse.json(json);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
