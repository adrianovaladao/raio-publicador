export const dynamic = "force-dynamic";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isAnyAdmin } from "@/lib/admin";

// POST /api/admin/fix-voucher-subscription
// Body: { emails: string[], credits?: number }
// Cria ou ativa assinatura VOUCHER para usuários que ficaram sem assinatura
// após falha no resgate automático pós-cadastro.

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = await currentUser();
  if (!isAnyAdmin(me?.publicMetadata as Record<string, unknown>))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { emails, credits = 100 } = await req.json() as { emails: string[]; credits?: number };
  if (!emails?.length) return NextResponse.json({ error: "emails array required" }, { status: 400 });

  const clerk = await clerkClient();
  const prisma = getPrisma();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const results = [];

  for (const email of emails) {
    try {
      // Busca usuário no Clerk
      const users = await clerk.users.getUserList({ emailAddress: [email] });
      const user = users.data[0];
      if (!user) { results.push({ email, status: "not_found_in_clerk" }); continue; }

      const ownerId = user.id;
      const existing = await prisma.subscription.findUnique({ where: { ownerId } });

      if (existing) {
        if (existing.status === "ACTIVE") {
          results.push({ email, status: "already_active", plan: existing.plan }); continue;
        }
        // Atualiza para ACTIVE com créditos
        await prisma.subscription.update({
          where: { ownerId },
          data: {
            plan: "VOUCHER",
            status: "ACTIVE",
            creditsTotal: credits,
            creditsUsed: 0,
            currentPeriodStart: now,
            currentPeriodEnd: expiresAt,
          },
        });
        results.push({ email, status: "updated", clerkId: ownerId, credits });
      } else {
        // Cria nova assinatura
        await prisma.subscription.create({
          data: {
            ownerId,
            plan: "VOUCHER",
            status: "ACTIVE",
            creditsTotal: credits,
            creditsUsed: 0,
            currentPeriodStart: now,
            currentPeriodEnd: expiresAt,
          },
        });
        results.push({ email, status: "created", clerkId: ownerId, credits });
      }
    } catch (e) {
      results.push({ email, status: "error", error: String(e) });
    }
  }

  return NextResponse.json({ ok: true, results });
}
