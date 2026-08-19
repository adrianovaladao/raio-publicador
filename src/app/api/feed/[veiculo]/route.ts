export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
const prisma = getPrisma();

// Tokens por veículo — adicione novos veículos parceiros aqui
const VEHICLE_TOKENS: Record<string, string> = {
  folhapress: process.env.FEED_TOKEN_FOLHAPRESS ?? "",
};

function xmlEscape(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function htmlToPlainText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ veiculo: string }> }
) {
  const { veiculo } = await params;
  const { searchParams } = req.nextUrl;
  const token  = searchParams.get("token") ?? "";
  const format = searchParams.get("format") ?? "rss"; // "rss" | "json"

  // Valida veículo e token
  const expectedToken = VEHICLE_TOKENS[veiculo.toLowerCase()];
  if (!expectedToken) {
    return NextResponse.json({ error: "Veículo não encontrado." }, { status: 404 });
  }
  if (!token || token !== expectedToken) {
    return NextResponse.json({ error: "Token inválido ou ausente." }, { status: 401 });
  }

  // Busca o veículo no banco pelo slug/nome
  const vehicle = await prisma.vehicle.findFirst({
    where: { domain: { contains: veiculo.toLowerCase() } },
    select: { id: true, name: true, domain: true },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Veículo não cadastrado." }, { status: 404 });
  }

  // Busca releases publicados que incluem este veículo
  const releases = await prisma.release.findMany({
    where: {
      status: "PUBLISHED",
      vehicles: { has: vehicle.id },
    },
    include: {
      brand: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  const isFolhapress = veiculo.toLowerCase() === "folhapress";

  if (format === "json") {
    const items = releases.map(r => isFolhapress
      ? {
          title:   r.title,
          summary: r.summary ?? "",
          body:    htmlToPlainText(r.body),
        }
      : {
          id:          r.id,
          title:       r.title,
          body:        r.body,
          summary:     r.summary ?? "",
          author:      r.brand.name,
          imageUrl:    r.imageUrl ?? null,
          publishedAt: r.publishedAt?.toISOString() ?? r.createdAt.toISOString(),
        }
    );
    return NextResponse.json({ veiculo: vehicle.name, total: items.length, items });
  }

  // RSS (XML)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://raiopublicador.com.br";
  const pubDate = (r: { publishedAt: Date | null; createdAt: Date }) =>
    (r.publishedAt ?? r.createdAt).toUTCString();

  const items = releases.map(r => isFolhapress
    ? `
    <item>
      <title>${xmlEscape(r.title)}</title>
      <subtitle><![CDATA[${r.summary ?? ""}]]></subtitle>
      <description><![CDATA[${htmlToPlainText(r.body)}]]></description>
      <pubDate>${pubDate(r)}</pubDate>
      <guid isPermaLink="false">${r.id}</guid>
      <link>${baseUrl}/releases/${r.id}</link>
    </item>`
    : `
    <item>
      <title>${xmlEscape(r.title)}</title>
      <description><![CDATA[${r.body}]]></description>
      <summary><![CDATA[${r.summary ?? ""}]]></summary>
      <author>${xmlEscape(r.brand.name)}</author>
      <pubDate>${pubDate(r)}</pubDate>
      <guid isPermaLink="false">${r.id}</guid>
      <link>${baseUrl}/releases/${r.id}</link>
      ${r.imageUrl ? `<enclosure url="${xmlEscape(r.imageUrl)}" type="image/jpeg" />` : ""}
    </item>`
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>Raio Publicador — ${xmlEscape(vehicle.name)}</title>\n    <link>${baseUrl}</link>\n    <description>Releases publicados no Raio Publicador para ${xmlEscape(vehicle.name)}</description>\n    <language>pt-BR</language>\n    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n    ${items}\n  </channel>\n</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
