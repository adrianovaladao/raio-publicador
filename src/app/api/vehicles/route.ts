export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const vehicles = await getPrisma().vehicle.findMany();
  return NextResponse.json(vehicles);
}
