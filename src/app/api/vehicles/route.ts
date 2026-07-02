export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const vehicles = await getPrisma().vehicle.findMany({
    where: { tier: { in: ["A", "B", "C"] } },
  });
  return NextResponse.json(vehicles);
}
