export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET not set" }, { status: 500 });

  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  let payload: { type: string; data: { id?: string } };
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(body, { "svix-id": svix_id, "svix-timestamp": svix_timestamp, "svix-signature": svix_signature }) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (payload.type === "user.deleted") {
    const clerkId = payload.data?.id;
    if (!clerkId) return NextResponse.json({ received: true });

    const prisma = getPrisma();

    // Delete in dependency order
    await prisma.supportMessage.deleteMany({ where: { conversation: { ownerId: clerkId } } });
    await prisma.supportConversation.deleteMany({ where: { ownerId: clerkId } });
    await prisma.supportTicket.deleteMany({ where: { ownerId: clerkId } });
    await prisma.invite.deleteMany({ where: { ownerId: clerkId } });
    const members = await prisma.teamMember.findMany({ where: { ownerId: clerkId }, select: { id: true } });
    await prisma.brandMember.deleteMany({ where: { teamMemberId: { in: members.map(m => m.id) } } });
    await prisma.teamMember.deleteMany({ where: { ownerId: clerkId } });
    await prisma.release.deleteMany({ where: { brand: { ownerId: clerkId } } });
    await prisma.brand.deleteMany({ where: { ownerId: clerkId } });
    await prisma.subscription.deleteMany({ where: { ownerId: clerkId } });
  }

  return NextResponse.json({ received: true });
}
