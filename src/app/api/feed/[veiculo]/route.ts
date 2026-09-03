export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { applyRateLimit, rateLimiters, getIp } from "@/lib/ratelimit";
const prisma = getPrisma();

// Tokens por veículo — adicione novos veículos parceiros aqui
const VEHICLE_TOKENS: Record<string, string> = {
  folhapress: process.env.FEED_TOKEN_FOLHAPRESS ?? "",
  ig:         process.env.FEED_TOKEN_IG ?? "",
  oglobo:     process.env.FEED_TOKEN_OGLOBO ?? "",
};

function xmlEscape(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function boldLinks(html: string) {
  // Wraps <a> anchor text in <strong> so links appear bold in partner feeds
  return html.replace(/(<a\b[^>]*>)([\s\S]*?)(<\/a>)/gi, "$1<strong>$2</strong>$3");
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
  const limited = await applyRateLimit(rateLimiters.feed, getIp(req));
  if (limited) return limited;

  const { veiculo } = await params;
  const { searchParams } = req.nextUrl;
  const token  = searchParams.get("token") ?? "";
  const format = searchParams.get("format") ?? "rss"; // "rss" | "json"
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10) || 50), 500) : 50;

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
    take: limit,
  });

  const isFolhapress = veiculo.toLowerCase() === "folhapress";
  const isIG         = veiculo.toLowerCase() === "ig";
  const isOGlobo     = veiculo.toLowerCase() === "oglobo";

  if (format === "json") {
    const items = releases.map(r => isFolhapress
      ? { title: r.title, summary: r.summary ?? "", body: htmlToPlainText(r.body) }
      : (isIG || isOGlobo)
      ? {
          guid:        r.id,
          title:       r.title,
          description: htmlToPlainText(r.summary ?? r.body).slice(0, 500),
          contentEncoded: r.body,
          pubDate:     pubDate(r),
          link:        `${baseUrl}/releases/${r.id}`,
          category:    r.brand.name,
          dcCreator:   r.brand.name,
          imageUrl:    r.imageUrl ?? null,
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
  const pubDate = (r: { publishedAt: Date | null; updatedAt: Date; createdAt: Date }) =>
    (r.publishedAt ?? r.updatedAt ?? r.createdAt).toUTCString();

  const items = releases.map(r => {
    if (isFolhapress) return `
    <item>
      <title>${xmlEscape(r.title)}</title>
      <subtitle><![CDATA[${r.summary ?? ""}]]></subtitle>
      <description><![CDATA[${boldLinks(r.body)}]]></description>
      <pubDate>${pubDate(r)}</pubDate>
      <guid isPermaLink="false">${r.id}</guid>
      <link>${baseUrl}/releases/${r.id}</link>
    </item>`;

    if (isIG || isOGlobo) {
      const description = xmlEscape(htmlToPlainText(r.summary ?? r.body).slice(0, 500));
      const categoryTag = `<category>${xmlEscape(r.brand.name)}</category>`;
      const mediaContent = r.imageUrl
        ? `<media:content url="${xmlEscape(r.imageUrl)}" type="image/jpeg"><media:credit>Divulgação</media:credit><media:text>${xmlEscape(r.title)}</media:text></media:content>`
        : "";
      return `
    <item>
      <title>${xmlEscape(r.title)}</title>
      <guid isPermaLink="false">${r.id}</guid>
      <link>${baseUrl}/releases/${r.id}</link>
      <description>${description}</description>
      <pubDate>${pubDate(r)}</pubDate>
      <content:encoded><![CDATA[${r.body}]]></content:encoded>
      ${categoryTag}
      <dc:creator>${xmlEscape(r.brand.name)}</dc:creator>
      <author>${xmlEscape(r.brand.name)}</author>
      ${mediaContent}
    </item>`;
    }

    return `
    <item>
      <title>${xmlEscape(r.title)}</title>
      <description><![CDATA[${r.body}]]></description>
      <summary><![CDATA[${r.summary ?? ""}]]></summary>
      <author>${xmlEscape(r.brand.name)}</author>
      <pubDate>${pubDate(r)}</pubDate>
      <guid isPermaLink="false">${r.id}</guid>
      <link>${baseUrl}/releases/${r.id}</link>
      ${r.imageUrl ? `<enclosure url="${xmlEscape(r.imageUrl)}" type="image/jpeg" />` : ""}
    </item>`;
  }).join("\n");

  const igNamespaces = (isIG || isOGlobo)
    ? ` xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/"`
    : "";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"${igNamespaces}>\n  <channel>\n    <title>Raio Publicador — ${xmlEscape(vehicle.name)}</title>\n    <link>${baseUrl}</link>\n    <description>Releases publicados no Raio Publicador para ${xmlEscape(vehicle.name)}</description>\n    <language>pt-BR</language>\n    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n    ${items}\n  </channel>\n</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
