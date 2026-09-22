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

  const body = await req.json() as { targetUserId: string; companyName: string };
  if (!body.targetUserId || !body.companyName) return NextResponse.json({ error: "campos obrigatórios ausentes" }, { status: 400 });

  const prisma = getPrisma();
  try {
    const profile = await prisma.fiscalProfile.update({
      where: { ownerId: body.targetUserId },
      data: { companyName: body.companyName },
    });
    return NextResponse.json({ ok: true, companyName: profile.companyName });
  } catch {
    return NextResponse.json({ ok: false, error: "FiscalProfile não encontrado para esse userId" }, { status: 404 });
  }
}
