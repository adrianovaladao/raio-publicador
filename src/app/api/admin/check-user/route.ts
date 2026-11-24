export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { assertMaster } from "@/lib/admin-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const prisma = getPrisma();
  const [sub, fiscal] = await Promise.all([
    prisma.subscription.findUnique({ where: { ownerId: userId } }),
    prisma.fiscalProfile.findUnique({ where: { ownerId: userId } }),
  ]);

  return NextResponse.json({ subscription: sub, fiscalProfile: fiscal });
}
