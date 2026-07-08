export const dynamic = "force-dynamic";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import { isMaster } from "@/lib/admin";

async function assertRaioAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return isMaster(user?.publicMetadata as Record<string, unknown>);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ clerkId: string }> }) {
  if (!await assertRaioAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { clerkId } = await params;
  const prisma = getPrisma();

  const [brands, releaseCount, teamMembers, sub] = await Promise.all([
    prisma.brand.findMany({
      where: { ownerId: clerkId },
      select: { id: true, name: true, color: true, logoUrl: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.release.count({ where: { authorId: clerkId } }),
    prisma.teamMember.findMany({
      where: { ownerId: clerkId },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.findUnique({ where: { ownerId: clerkId } }),
  ]);

  // Fetch brand release counts
  const brandIds = brands.map(b => b.id);
  const brandReleaseCounts = brandIds.length > 0
    ? await prisma.release.groupBy({
        by: ["brandId"],
        where: { brandId: { in: brandIds } },
        _count: { id: true },
      })
    : [];
  const brandCountMap = Object.fromEntries(brandReleaseCounts.map(r => [r.brandId, r._count.id]));

  // Fetch Stripe invoices
  let invoices: { id: string; date: number; amount: number; status: string; description: string }[] = [];
  if (sub?.stripeCustomerId) {
    try {
      const stripe = getStripe();
      const stripeInvoices = await stripe.invoices.list({ customer: sub.stripeCustomerId, limit: 12 });
      invoices = stripeInvoices.data.map(inv => ({
        id: inv.id,
        date: inv.created,
        amount: inv.amount_paid,
        status: inv.status ?? "unknown",
        description: inv.lines.data[0]?.description ?? "—",
      }));
    } catch {
      // Stripe not available — skip
    }
  }

  return NextResponse.json({
    brands: brands.map(b => ({ ...b, releaseCount: brandCountMap[b.id] ?? 0 })),
    releaseCount,
    teamMembers,
    invoices,
  });
}
