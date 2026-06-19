export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const members = await getPrisma().teamMember.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members);
}
