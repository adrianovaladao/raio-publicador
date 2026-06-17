export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const brands = await getPrisma().brand.findMany({ where: { ownerId: userId }, orderBy: { name: "asc" } });
  return NextResponse.json(brands);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const brand = await getPrisma().brand.create({ data: { ...body, ownerId: userId } });
  return NextResponse.json(brand, { status: 201 });
}
