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

  const { targetUserId, stripeCustomerId } = await req.json() as Record<string, string>;
  if (!targetUserId || !stripeCustomerId) return NextResponse.json({ error: "targetUserId e stripeCustomerId obrigatórios" }, { status: 400 });

  const prisma = getPrisma();
  const sub = await prisma.subscription.update({
    where: { ownerId: targetUserId },
    data: { stripeCustomerId },
  });
  return NextResponse.json({ ok: true, stripeCustomerId: sub.stripeCustomerId });
}
