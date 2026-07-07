export const dynamic = "force-dynamic";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const me = await currentUser();
  if (me?.publicMetadata?.raioAdmin !== true) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prisma = getPrisma();
  const releases = await prisma.release.findMany({
    include: { brand: { select: { name: true, color: true } } },
    orderBy: { updatedAt: "desc" },
  });

  // Batch-fetch Clerk users for all unique authorIds
  const authorIds = [...new Set(releases.map(r => r.authorId))];
  const clerk = await clerkClient();
  const userMap: Record<string, { name: string; email: string }> = {};
  await Promise.allSettled(
    authorIds.map(async id => {
      try {
        const u = await clerk.users.getUser(id);
        userMap[id] = {
          name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.emailAddresses[0]?.emailAddress || id,
          email: u.emailAddresses[0]?.emailAddress || "",
        };
      } catch {
        userMap[id] = { name: id, email: "" };
      }
    })
  );

  const rows = releases.map(r => ({
    ...r,
    author: userMap[r.authorId] ?? { name: r.authorId, email: "" },
  }));

  return NextResponse.json(rows);
}
