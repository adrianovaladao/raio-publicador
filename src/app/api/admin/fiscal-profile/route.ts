export const dynamic = "force-dynamic";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { isMaster } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerk = await clerkClient();
  const me = await clerk.users.getUser(userId);
  if (!isMaster(me.publicMetadata)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { targetUserId, ...profileData } = await req.json() as Record<string, string>;
  if (!targetUserId) return NextResponse.json({ error: "targetUserId obrigatório" }, { status: 400 });

  const prisma = getPrisma();
  const profile = await prisma.fiscalProfile.upsert({
    where: { ownerId: targetUserId },
    update: { ...profileData },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: { ownerId: targetUserId, ...(profileData as any) },
  });
  return NextResponse.json({ ok: true, companyName: profile.companyName });
}
