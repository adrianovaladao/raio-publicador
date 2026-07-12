export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const prisma = getPrisma();

  const release = await prisma.release.findUnique({
    where: { id },
    select: { publishedVehicleUrls: true, status: true, brand: { select: { ownerId: true } } },
  });

  if (!release) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMember = await prisma.teamMember.findFirst({ where: { ownerId: release.brand.ownerId, clerkId: userId } });
  if (release.brand.ownerId !== userId && !isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pubUrls = (release.publishedVehicleUrls ?? {}) as Record<string, string>;
  const toAbs = (u: string) => /^https?:\/\//i.test(u) ? u : `https://${u}`;

  const results = await Promise.all(
    Object.entries(pubUrls).map(async ([vehicleId, rawUrl]) => {
      const url = toAbs(rawUrl);
      try {
        const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8000), redirect: "follow" });
        return { vehicleId, url, ok: res.ok, status: res.status };
      } catch {
        return { vehicleId, url, ok: false, status: 0 };
      }
    })
  );

  return NextResponse.json({ results });
}
