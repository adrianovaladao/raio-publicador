export const dynamic = "force-dynamic";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { isMaster } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerk = await clerkClient();
  const me = await clerk.users.getUser(userId);
  if (!isMaster(me.publicMetadata)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { targetUserId } = await req.json() as { targetUserId: string };
  if (!targetUserId) return NextResponse.json({ error: "targetUserId obrigatório" }, { status: 400 });

  await getPrisma().fiscalProfile.delete({ where: { ownerId: targetUserId } });
  return NextResponse.json({ ok: true });
}
