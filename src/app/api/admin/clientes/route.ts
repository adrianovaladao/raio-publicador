export const dynamic = "force-dynamic";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isMaster } from "@/lib/admin";

async function assertRaioAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return isMaster(user?.publicMetadata as Record<string, unknown>);
}

export async function GET() {
  if (!await assertRaioAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prisma = getPrisma();
  const clerk = await clerkClient();

  const profiles = await prisma.fiscalProfile.findMany({
    orderBy: { createdAt: "desc" },
  });

  const ownerIds = profiles.map(p => p.ownerId);

  // Busca usuários no Clerk em batch
  const clerkUsers = await clerk.users.getUserList({ limit: 500 });
  const clerkMap = new Map(clerkUsers.data.map(u => [u.id, u]));

  // Busca assinaturas para cruzar plano/status
  const subs = await prisma.subscription.findMany({
    where: { ownerId: { in: ownerIds } },
  });
  const subMap = new Map(subs.map(s => [s.ownerId, s]));

  const rows = profiles.map(p => {
    const cu = clerkMap.get(p.ownerId);
    const sub = subMap.get(p.ownerId);
    return {
      ownerId:     p.ownerId,
      email:       cu?.emailAddresses[0]?.emailAddress ?? "—",
      clerkName:   [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") || null,
      personType:  p.personType,
      fullName:    p.fullName ?? null,
      cpf:         p.cpf ?? null,
      companyName: p.companyName ?? null,
      cnpj:        p.cnpj ?? null,
      cep:         p.cep,
      street:      p.street,
      number:      p.number,
      complement:  p.complement ?? null,
      district:    p.district,
      city:        p.city,
      state:       p.state,
      plan:        sub?.plan ?? null,
      status:      sub?.status ?? null,
      createdAt:   p.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ rows });
}

// DELETE /api/admin/clientes — remove fiscal profile(s) by ownerId
export async function DELETE(req: NextRequest) {
  if (!await assertRaioAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { ownerIds } = await req.json() as { ownerIds: string[] };
  if (!Array.isArray(ownerIds) || ownerIds.length === 0)
    return NextResponse.json({ error: "ownerIds obrigatório" }, { status: 400 });

  const { count } = await getPrisma().fiscalProfile.deleteMany({ where: { ownerId: { in: ownerIds } } });
  return NextResponse.json({ deleted: count });
}
