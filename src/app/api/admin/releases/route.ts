export const dynamic = "force-dynamic";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isAnyAdmin } from "@/lib/admin";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const me = await currentUser();
  if (!isAnyAdmin(me?.publicMetadata as Record<string, unknown>)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prisma = getPrisma();
  const releases = await prisma.release.findMany({
    where: { status: { not: "DRAFT" } },
    include: { brand: { select: { name: true, color: true, logoUrl: true } } },
    orderBy: { updatedAt: "desc" },
  });

  // Batch-fetch Clerk users for all unique authorIds
  const authorIds = [...new Set(releases.map(r => r.authorId))];
  const clerk = await clerkClient();
  const userMap: Record<string, { name: string; email: string }> = {};
  await Promise.allSettled(
    authorIds.map(async id => {
      try {
        const u = await clerk.users.getUser(id);
        userMap[id] = {
          name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.emailAddresses[0]?.emailAddress || id,
          email: u.emailAddresses[0]?.emailAddress || "",
        };
      } catch {
        userMap[id] = { name: id, email: "" };
      }
    })
  );

  // Resolve vehicle IDs → names
  const allVehicleIds = [...new Set(releases.flatMap(r => r.vehicles as string[]))];
  const vehicleRecords = allVehicleIds.length > 0
    ? await prisma.vehicle.findMany({ where: { id: { in: allVehicleIds } }, select: { id: true, name: true } })
    : [];
  const vehicleMap = Object.fromEntries(vehicleRecords.map(v => [v.id, v.name]));

  const rows = releases.map(r => ({
    ...r,
    shortId: r.id.slice(-7).toUpperCase(),
    author: userMap[r.authorId] ?? { name: r.authorId, email: "" },
    vehicleNames: (r.vehicles as string[]).map(id => ({ id, name: vehicleMap[id] ?? id })),
  }));

  return NextResponse.json(rows);
}
