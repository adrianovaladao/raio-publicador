import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("key") !== "raio2026") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const prisma = getPrisma();
  const subs = await prisma.subscription.findMany({
    select: { ownerId: true, plan: true, status: true, creditsTotal: true, createdAt: true },
  });
  return NextResponse.json(subs);
}
