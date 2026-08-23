export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const txId = req.nextUrl.searchParams.get("txId");
  if (!txId) return NextResponse.json({ error: "txId obrigatório" }, { status: 400 });

  const payment = await getPrisma().pixPayment.findFirst({
    where: { txId, ownerId: userId },
    select: { status: true },
  });

  if (!payment) return NextResponse.json({ status: "NOT_FOUND" }, { status: 404 });

  return NextResponse.json({ status: payment.status });
}
