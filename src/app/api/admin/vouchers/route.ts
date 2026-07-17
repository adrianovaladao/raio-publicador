export const dynamic = "force-dynamic";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isAnyAdmin } from "@/lib/admin";

async function checkAdmin(userId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return isAnyAdmin(user.publicMetadata as Record<string, unknown>);
}

export async function GET() {
  const { userId } = await auth();
  if (!userId || !(await checkAdmin(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const vouchers = await getPrisma().voucher.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  });

  return NextResponse.json(vouchers);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId || !(await checkAdmin(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { code, credits, maxUses, description, expiresAt } = await req.json() as {
    code: string; credits: number; maxUses?: number; description?: string; expiresAt?: string;
  };

  if (!code?.trim() || !credits || credits < 1)
    return NextResponse.json({ error: "Código e créditos são obrigatórios." }, { status: 400 });

  const voucher = await getPrisma().voucher.create({
    data: {
      code:        code.trim().toUpperCase(),
      credits,
      maxUses:     maxUses ?? 1,
      description: description?.trim() || null,
      expiresAt:   expiresAt ? new Date(expiresAt) : null,
    },
  });

  return NextResponse.json(voucher, { status: 201 });
}
