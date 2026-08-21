export const dynamic = "force-dynamic";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isAnyAdmin } from "@/lib/admin";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = await currentUser();
  if (!isAnyAdmin(me?.publicMetadata as Record<string, unknown>))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { emails, credits } = await req.json() as { emails: string[]; credits: number };
  const clerk = await clerkClient();
  const prisma = getPrisma();
  const results = [];

  for (const email of emails) {
    const users = await clerk.users.getUserList({ emailAddress: [email] });
    const user = users.data[0];
    if (!user) { results.push({ email, status: "not_found" }); continue; }
    await prisma.subscription.update({
      where: { ownerId: user.id },
      data: { creditsTotal: credits, creditsUsed: 0 },
    });
    results.push({ email, status: "updated", credits });
  }

  return NextResponse.json({ ok: true, results });
}
