export const dynamic = "force-dynamic";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isAnyAdmin } from "@/lib/admin";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  if (!isAnyAdmin(user.publicMetadata as Record<string, unknown>)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await getPrisma().voucher.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
