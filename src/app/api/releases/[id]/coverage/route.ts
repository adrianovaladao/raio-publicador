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
    select: {
      title: true,
      status: true,
      publishedVehicleUrls: true,
      vehicles: true,
      brand: { select: { ownerId: true } },
    },
  });

  if (!release) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMember = await prisma.teamMember.findFirst({ where: { ownerId: release.brand.ownerId, clerkId: userId } });
  if (release.brand.ownerId !== userId && !isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (release.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Release ainda não publicado" }, { status: 400 });
  }

  const pubUrls = (release.publishedVehicleUrls ?? {}) as Record<string, string>;
  const urlEntries = Object.entries(pubUrls).filter(([, u]) => u?.trim());

  if (urlEntries.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "EXA_API_KEY não configurada" }, { status: 500 });

  // Fetch vehicle names for labels
  const vehicles = await prisma.vehicle.findMany({
    where: { id: { in: urlEntries.map(([vid]) => vid) } },
    select: { id: true, name: true, domain: true },
  });
  const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));

  const toAbs = (u: string) => /^https?:\/\//i.test(u) ? u : `https://${u}`;
  const urls = urlEntries.map(([, u]) => toAbs(u));

  const exa = new Exa(apiKey);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contents = await (exa as any).getContents(urls, { highlights: true });

    const byUrl = Object.fromEntries(
      (contents.results ?? []).map((r: { url: string; title?: string; highlights?: string[] }) => [r.url, r])
    );

    const results = urlEntries.map(([vehicleId, rawUrl]) => {
      const url = toAbs(rawUrl);
      const r = byUrl[url] as { url: string; title?: string; highlights?: string[] } | undefined;
      const vehicle = vehicleMap[vehicleId];
      return {
        vehicleId,
        vehicleName: vehicle?.name ?? vehicleId,
        vehicleDomain: vehicle?.domain ?? "",
        url,
        title: r?.title ?? null,
        highlights: r?.highlights ?? [],
      };
    });

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[coverage] exa error", err);
    return NextResponse.json({ error: "Erro ao extrair conteúdo das URLs" }, { status: 500 });
  }
}
