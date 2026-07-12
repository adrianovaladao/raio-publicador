export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Exa from "exa-js";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const prisma = getPrisma();

  const release = await prisma.release.findUnique({
    where: { id },
    select: { title: true, authorId: true, publishedAt: true, status: true, brand: { select: { ownerId: true } } },
  });

  if (!release) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only owner or team members can query
  const isMember = await prisma.teamMember.findFirst({ where: { ownerId: release.brand.ownerId, clerkId: userId } });
  if (release.brand.ownerId !== userId && !isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (release.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Release ainda não publicado" }, { status: 400 });
  }

  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "EXA_API_KEY não configurada" }, { status: 500 });

  const exa = new Exa(apiKey);

  try {
    const results = await exa.search(`"${release.title}"`, {
      type: "auto",
      numResults: 10,
      contents: { highlights: true },
      ...(release.publishedAt && {
        startPublishedDate: new Date(release.publishedAt).toISOString().split("T")[0],
      }),
    });

    return NextResponse.json({
      query: release.title,
      results: results.results.map(r => ({
        title: r.title,
        url: r.url,
        publishedDate: r.publishedDate,
        highlights: (r as unknown as { highlights?: string[] }).highlights ?? [],
      })),
    });
  } catch (err) {
    console.error("[coverage] exa error", err);
    return NextResponse.json({ error: "Erro ao buscar menções" }, { status: 500 });
  }
}
