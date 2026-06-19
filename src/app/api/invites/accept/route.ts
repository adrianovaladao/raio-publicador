export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

  // Mark as accepted and create/update TeamMember
  await getPrisma().$transaction([
    getPrisma().invite.update({ where: { token }, data: { accepted: true } }),
    getPrisma().teamMember.upsert({
      where: { clerkId: userId },
      update: { status: "ACTIVE" },
      create: {
        clerkId: userId,
        email: invite.email,
        name: invite.email.split("@")[0],
        role: invite.role,
        status: "ACTIVE",
        ownerId: invite.ownerId,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
