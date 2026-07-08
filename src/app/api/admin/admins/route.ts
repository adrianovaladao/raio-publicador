export const dynamic = "force-dynamic";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { isMaster, type AdminRole } from "@/lib/admin";

async function assertMaster() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return isMaster(user?.publicMetadata as Record<string, unknown>);
}

// GET — list all users who have any admin role
export async function GET() {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const clerk = await clerkClient();
  const { data: allUsers } = await clerk.users.getUserList({ limit: 500 });

  const admins = allUsers
    .filter(u => {
      const v = u.publicMetadata?.raioAdmin;
      return v === "master" || v === "editor" || v === true;
    })
    .map(u => ({
      clerkId: u.id,
      email: u.emailAddresses[0]?.emailAddress ?? "—",
      name: [u.firstName, u.lastName].filter(Boolean).join(" ") || "—",
      role: u.publicMetadata?.raioAdmin === true ? "master" : u.publicMetadata?.raioAdmin as string,
    }));

  return NextResponse.json(admins);
}

// POST — set or update admin role for a user (by email or clerkId)
export async function POST(req: NextRequest) {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, clerkId, role } = await req.json() as { email?: string; clerkId?: string; role: AdminRole };

  if (!["master", "editor"].includes(role))
    return NextResponse.json({ error: "Role inválido. Use 'master' ou 'editor'." }, { status: 400 });

  const clerk = await clerkClient();

  let targetId = clerkId;
  if (!targetId && email) {
    const { data } = await clerk.users.getUserList({ emailAddress: [email] });
    if (!data[0]) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    targetId = data[0].id;
  }
  if (!targetId) return NextResponse.json({ error: "Informe email ou clerkId." }, { status: 400 });

  await clerk.users.updateUserMetadata(targetId, { publicMetadata: { raioAdmin: role } });

  return NextResponse.json({ ok: true, clerkId: targetId, role });
}

// DELETE — remove admin role from a user
export async function DELETE(req: NextRequest) {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { clerkId } = await req.json() as { clerkId: string };
  if (!clerkId) return NextResponse.json({ error: "clerkId obrigatório." }, { status: 400 });

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(clerkId, { publicMetadata: { raioAdmin: null } });

  return NextResponse.json({ ok: true });
}
