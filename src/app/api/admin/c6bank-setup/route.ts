export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { assertAnyAdmin } from "@/lib/admin-server";
import { registrarWebhook } from "@/lib/c6bank";
import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/c6bank-setup — registra o webhook no C6 Bank (chamar 1x)
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await assertAnyAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const webhookUrl = `${req.nextUrl.origin}/api/webhooks/c6bank`;

  try {
    await registrarWebhook(webhookUrl);
    return NextResponse.json({ ok: true, webhookUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("[c6bank-setup]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
