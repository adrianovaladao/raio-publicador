import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const prisma = getPrisma();
  const subs = await prisma.subscription.findMany({
    where: { status: "ACTIVE" },
    select: { ownerId: true, plan: true, status: true, creditsTotal: true, createdAt: true },
  });
  return NextResponse.json(subs);
}
