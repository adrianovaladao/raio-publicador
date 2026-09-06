export const dynamic = "force-dynamic";
import { getStripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

// Rota temporária de diagnóstico — remover após teste
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.PROVISION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get("email") ?? "cleannowacar@gmail.com";
  const stripe = getStripe();

  const customers = await stripe.customers.list({ email, limit: 5 });

  if (customers.data.length === 0) {
    return NextResponse.json({ found: false, email });
  }

  const results = await Promise.all(customers.data.map(async c => {
    const taxIds = await stripe.customers.listTaxIds(c.id);
    return {
      id: c.id,
      email: c.email,
      name: c.name,
      address: c.address,
      taxIds: taxIds.data.map(t => ({ type: t.type, value: t.value })),
    };
  }));

  return NextResponse.json({ found: true, customers: results });
}
