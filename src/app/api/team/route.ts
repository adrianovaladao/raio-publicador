export const dynamic = "force-dynamic";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const clerk = await clerkClient();

    // Se for membro de equipe, usa o ownerId para buscar autores do dono
    const self = await getPrisma().teamMember.findUnique({
      where: { clerkId: userId },
      select: { ownerId: true, status: true },
    });
    const accountOwnerId = (self?.status === "ACTIVE") ? self.ownerId : userId;

    const ownerClerkUser = await clerk.users.getUser(accountOwnerId);
    const fullName = [ownerClerkUser.firstName, ownerClerkUser.lastName].filter(Boolean).join(" ");
    const ownerName = fullName || (ownerClerkUser.emailAddresses[0]?.emailAddress ?? "Eu");

    const members = await getPrisma().teamMember.findMany({
      where: { ownerId: accountOwnerId, status: "ACTIVE" },
      orderBy: { name: "asc" },
    });

    const authors = [
      { id: accountOwnerId, name: ownerName },
      ...members.map(m => ({ id: m.id, name: m.name })),
    ];

    return NextResponse.json(authors);
  } catch (e) {
    console.error("[GET /api/team]", e);
    return NextResponse.json({ error: "Erro ao buscar membros." }, { status: 500 });
  }
}
