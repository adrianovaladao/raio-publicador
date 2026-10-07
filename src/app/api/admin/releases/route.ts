export const dynamic = "force-dynamic";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { assertAnyAdmin } from "@/lib/admin-server";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 50;

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!await assertAnyAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const tab      = (searchParams.get("tab") ?? "queue") as "queue" | "published" | "archived";
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const search   = searchParams.get("search")?.trim() ?? "";
  const vehicles = searchParams.get("vehicles")?.split(",").filter(Boolean) ?? [];
  const date     = searchParams.get("date") ?? ""; // YYYY-MM-DD

  const prisma = getPrisma();

  // ── Where clause por tab ─────────────────────────────────────────────────
  const tabWhere: Prisma.ReleaseWhereInput =
    tab === "queue"
      ? { status: { notIn: ["DRAFT", "PUBLISHED", "CANCELLED"] } }
      : tab === "published"
      ? { status: "PUBLISHED", archivedAt: null }
      : { status: "PUBLISHED", archivedAt: { not: null } };

  // ── Filtro de veículos ────────────────────────────────────────────────────
  const vehicleWhere: Prisma.ReleaseWhereInput =
    vehicles.length > 0
      ? { vehicles: { hasSome: vehicles } }
      : {};

  // ── Filtro de busca ───────────────────────────────────────────────────────
  const searchWhere: Prisma.ReleaseWhereInput = search
    ? { title: { contains: search, mode: "insensitive" } }
    : {};

  // ── Filtro de data ────────────────────────────────────────────────────────
  let dateWhere: Prisma.ReleaseWhereInput = {};
  if (date) {
    const start = new Date(date + "T00:00:00.000Z");
    const end   = new Date(date + "T23:59:59.999Z");
    const field =
      tab === "queue"     ? { scheduledAt: { gte: start, lte: end } } :
      tab === "published" ? { publishedAt:  { gte: start, lte: end } } :
                            { archivedAt:   { gte: start, lte: end } };
    dateWhere = field;
  }

  const where: Prisma.ReleaseWhereInput = {
    ...tabWhere,
    ...vehicleWhere,
    ...searchWhere,
    ...dateWhere,
  };

  // ── OrderBy por tab ───────────────────────────────────────────────────────
  const orderBy: Prisma.ReleaseOrderByWithRelationInput =
    tab === "queue"
      ? { scheduledAt: "asc" }
      : tab === "published"
      ? { publishedAt: "desc" }
      : { archivedAt: "desc" };

  // ── Counts para as abas (sem filtros de busca/veículo/data) ───────────────
  const [queueCount, publishedCount, archivedCount, total, releases] = await Promise.all([
    prisma.release.count({ where: { status: { notIn: ["DRAFT", "PUBLISHED", "CANCELLED"] } } }),
    prisma.release.count({ where: { status: "PUBLISHED", archivedAt: null } }),
    prisma.release.count({ where: { status: "PUBLISHED", archivedAt: { not: null } } }),
    prisma.release.count({ where }),
    prisma.release.findMany({
      where,
      include: { brand: { select: { name: true, color: true, logoUrl: true } } },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  // ── Batch-fetch Clerk users ───────────────────────────────────────────────
  const authorIds = [...new Set(releases.map(r => r.authorId))];
  const clerk = await clerkClient();
  const userMap: Record<string, { name: string; email: string }> = {};
  if (authorIds.length > 0) {
    try {
      const clerkUsers = await clerk.users.getUserList({ userId: authorIds, limit: 500 });
      for (const u of clerkUsers.data) {
        userMap[u.id] = {
          name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.emailAddresses[0]?.emailAddress || u.id,
          email: u.emailAddresses[0]?.emailAddress || "",
        };
      }
    } catch { /* fallback: show authorId */ }
  }

  // ── Resolve vehicle IDs → names ───────────────────────────────────────────
  const allVehicleIds = [...new Set(releases.flatMap(r => r.vehicles as string[]))];
  const vehicleRecords = allVehicleIds.length > 0
    ? await prisma.vehicle.findMany({ where: { id: { in: allVehicleIds } }, select: { id: true, name: true } })
    : [];
  const vehicleMap = Object.fromEntries(vehicleRecords.map(v => [v.id, v.name]));

  const rows = releases.map(r => ({
    ...r,
    shortId: r.id.slice(-7).toUpperCase(),
    author: userMap[r.authorId] ?? { name: r.authorId, email: "" },
    vehicleNames: (r.vehicles as string[]).filter(id => vehicleMap[id]).map(id => ({ id, name: vehicleMap[id] })),
  }));

  // needsAction: releases aguardando ação do admin
  const needsAction = await prisma.release.count({
    where: { status: { in: ["SCHEDULED", "IN_PUBLICATION"] } },
  });

  return NextResponse.json({
    releases: rows,
    counts: { queue: queueCount, published: publishedCount, archived: archivedCount },
    needsAction,
    total,
    page,
    hasMore: page * PAGE_SIZE < total,
  });
}
