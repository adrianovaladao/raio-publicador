export const dynamic = "force-dynamic";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ");
    const ownerName = fullName || (clerkUser.emailAddresses[0]?.emailAddress ?? "Eu");

    const members = await getPrisma().teamMember.findMany({
      where: { ownerId: userId, status: "ACTIVE" },
      orderBy: { name: "asc" },
    });

    const authors = [
      { id: userId, name: ownerName },
      ...members.map(m => ({ id: m.id, name: m.name })),
    ];

    return NextResponse.json(authors);
  } catch (e) {
    console.error("[GET /api/team]", e);
    return NextResponse.json({ error: "Erro ao buscar membros." }, { status: 500 });
  }
}
