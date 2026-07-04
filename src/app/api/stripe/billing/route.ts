export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { getPrisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function getCustomerId(userId: string) {
  const sub = await getPrisma().subscription.findUnique({ where: { ownerId: userId } });
  return sub?.stripeCustomerId ?? null;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customerId = await getCustomerId(userId);
  if (!customerId) return NextResponse.json({});

  const stripe = getStripe();
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return NextResponse.json({});

  const addr = customer.address;
  return NextResponse.json({
    name: customer.name ?? "",
    email: customer.email ?? "",
    taxId: customer.metadata?.taxId ?? "",
    address: addr ? `${addr.line1 ?? ""}${addr.line2 ? ", " + addr.line2 : ""}${addr.city ? " · " + addr.city : ""}${addr.state ? ", " + addr.state : ""}` : "",
  });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, taxId, line1, line2, city, state, postalCode } =
    await req.json() as { name?: string; email?: string; taxId?: string; line1?: string; line2?: string; city?: string; state?: string; postalCode?: string };

  const customerId = await getCustomerId(userId);
  if (!customerId) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const stripe = getStripe();
  const updated = await stripe.customers.update(customerId, {
    ...(name  ? { name }  : {}),
    ...(email ? { email } : {}),
    address: { line1: line1 ?? "", line2: line2 ?? "", city: city ?? "", state: state ?? "", postal_code: postalCode ?? "", country: "BR" },
    metadata: taxId != null ? { taxId } : {},
  });

  return NextResponse.json({ ok: true, name: updated.name, email: updated.email });
}
