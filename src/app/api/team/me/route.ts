export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Returns the TeamMember record for the current user, or null if they are an account owner.
// Used by the AppShell to detect editor sessions.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(null);

  const member = await getPrisma().teamMember.findUnique({
    where: { clerkId: userId },
    select: { role: true, ownerId: true, name: true, status: true },
  });

  if (!member || member.status !== "ACTIVE") return NextResponse.json(null);

  return NextResponse.json({
    role:    member.role,
    ownerId: member.ownerId,
    name:    member.name,
  });
}
