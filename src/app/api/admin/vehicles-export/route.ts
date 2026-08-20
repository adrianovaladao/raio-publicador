export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isAnyAdmin } from "@/lib/admin";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = await currentUser();
  if (!isAnyAdmin(me?.publicMetadata as Record<string, unknown>))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const prisma = getPrisma();
  const vehicles = await prisma.vehicle.findMany({
    select: { id: true, name: true, domain: true, location: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(vehicles);
}
