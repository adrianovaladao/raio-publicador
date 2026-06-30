export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const brands = await getPrisma().brand.findMany({ where: { ownerId: userId }, orderBy: { name: "asc" } });
    return NextResponse.json(brands);
  } catch (e) {
    console.error("[GET /api/brands]", e);
    return NextResponse.json({ error: "Erro ao buscar marcas." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const prisma = getPrisma();

    const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });
    const plan = sub ? PLANS[sub.plan as keyof typeof PLANS] : null;
    if (plan) {
      const count = await prisma.brand.count({ where: { ownerId: userId } });
      if (count >= plan.brandsLimit) {
        return NextResponse.json({ error: "BRAND_LIMIT_REACHED", brandsLimit: plan.brandsLimit }, { status: 403 });
      }
    }

    const body = await req.json();
    const brand = await prisma.brand.create({ data: { ...body, ownerId: userId } });
    return NextResponse.json(brand, { status: 201 });
  } catch (e) {
    console.error("[POST /api/brands]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
