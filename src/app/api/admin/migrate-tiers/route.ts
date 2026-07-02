export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// One-time migration: delete D/E vehicles and update tier B/C token values
// Protected: only the owner account can call this
const OWNER_ID = process.env.OWNER_CLERK_ID;

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (OWNER_ID && userId !== OWNER_ID) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prisma = getPrisma();

  const deleted = await prisma.vehicle.deleteMany({
    where: { tier: { in: ["D", "E"] } },
  });

  return NextResponse.json({ ok: true, deleted: deleted.count });
}
