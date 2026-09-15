export const dynamic = "force-dynamic";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notify";

// GET /api/invites/accept?token=xxx — validate invite without accepting
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token inválido." }, { status: 400 });

  const invite = await getPrisma().invite.findUnique({ where: { token } });
  if (!invite) return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
  if (invite.accepted) return NextResponse.json({ error: "Este convite já foi utilizado." }, { status: 410 });
  if (new Date() > invite.expiresAt) return NextResponse.json({ error: "Este convite expirou." }, { status: 410 });

  return NextResponse.json({ email: invite.email, role: invite.role, expired: false, accepted: false });
}

// POST /api/invites/accept — mark invite as accepted and create TeamMember
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await req.json() as { token: string };
  if (!token) return NextResponse.json({ error: "Token inválido." }, { status: 400 });

  const invite = await getPrisma().invite.findUnique({ where: { token } });
  if (!invite) return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
  if (invite.accepted) return NextResponse.json({ error: "Este convite já foi utilizado." }, { status: 410 });
  if (new Date() > invite.expiresAt) return NextResponse.json({ error: "Este convite expirou." }, { status: 410 });

  // Fetch real name from Clerk
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(userId);
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || invite.email.split("@")[0];

  const prisma = getPrisma();

  // Mark as accepted, create/update TeamMember, and connect brands
  const member = await prisma.teamMember.upsert({
    where: { clerkId: userId },
    update: { status: "ACTIVE", name, ownerId: invite.ownerId, role: invite.role },
    create: {
      clerkId: userId,
      email: invite.email,
      name,
      role: invite.role,
      status: "ACTIVE",
      ownerId: invite.ownerId,
    },
  });

  // Connect brandIds from the invite (replace existing brand associations)
  if (invite.brandIds.length > 0) {
    await prisma.brandMember.deleteMany({ where: { teamMemberId: member.id } });
    await prisma.brandMember.createMany({
      data: invite.brandIds.map(brandId => ({ brandId, teamMemberId: member.id })),
      skipDuplicates: true,
    });
  }

  await prisma.invite.update({ where: { token }, data: { accepted: true } });

  // Notify the workspace owner
  const ROLE_LABELS: Record<string, string> = { EDITOR: "Editor", ADMIN: "Administrador" };
  await createNotification(invite.ownerId, "member_joined",
    "Novo membro na equipe",
    `${name} aceitou o convite e entrou como ${ROLE_LABELS[invite.role] ?? invite.role}.`,
    "/configuracoes?tab=equipe",
  ).catch(console.error);

  return NextResponse.json({ ok: true });
}
