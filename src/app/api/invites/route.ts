export const dynamic = "force-dynamic";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";
import { NextResponse } from "next/server";
import { sendInviteEmail } from "@/lib/email";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invites = await getPrisma().invite.findMany({
    where: { ownerId: userId, accepted: false },
    orderBy: { sentAt: "desc" },
  });

  return NextResponse.json(invites);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, role, brandIds } = await req.json() as {
    email: string;
    role: string;
    brandIds: string[];
  };

  if (!email) return NextResponse.json({ error: "E-mail obrigatório." }, { status: 400 });

  // Get owner name for the email
  const clerk = await clerkClient();
  const owner = await clerk.users.getUser(userId);
  const ownerName = [owner.firstName, owner.lastName].filter(Boolean).join(" ") || "Alguém";

  // Enforce per-role limits based on subscription plan
  const normalizedRole = role === "admin" ? "ADMIN" : "EDITOR";
  if (normalizedRole === "EDITOR") {
    const sub = await getPrisma().subscription.findUnique({ where: { ownerId: userId } });
    const planMeta = sub ? PLANS[sub.plan as keyof typeof PLANS] : null;
    if (planMeta) {
      const limit = planMeta.editorsLimit;
      const [memberCount, inviteCount] = await Promise.all([
        getPrisma().teamMember.count({ where: { ownerId: userId, role: "EDITOR", status: "ACTIVE" } }),
        getPrisma().invite.count({ where: { ownerId: userId, role: "EDITOR", accepted: false } }),
      ]);
      if (memberCount + inviteCount >= limit) {
        return NextResponse.json(
          { error: `Limite de editores atingido para o plano ${planMeta.label} (máx. ${limit}).` },
          { status: 403 }
        );
      }
    }
  }

  // Check for existing pending invite
  const existing = await getPrisma().invite.findFirst({
    where: { ownerId: userId, email, accepted: false },
  });
  if (existing) {
    return NextResponse.json({ error: "Já existe um convite pendente para este e-mail." }, { status: 409 });
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await getPrisma().invite.create({
    data: {
      email,
      role: normalizedRole,
      brandIds: brandIds ?? [],
      ownerId: userId,
      expiresAt,
    },
  });

  const roleLabel = role === "admin" ? "Administração" : "Edição";
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://raiopublicador.com.br"}/convite/${invite.token}`;

  const { error: emailError } = await sendInviteEmail(email, ownerName, roleLabel, inviteUrl);

  if (emailError) {
    console.error("[invites] Resend error:", JSON.stringify(emailError));
    return NextResponse.json(
      { error: `Convite criado, mas falha ao enviar e-mail: ${(emailError as { message?: string }).message}` },
      { status: 500 }
    );
  }

  return NextResponse.json(invite, { status: 201 });
}
