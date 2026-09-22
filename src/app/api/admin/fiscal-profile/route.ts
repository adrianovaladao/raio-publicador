export const dynamic = "force-dynamic";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { isMaster } from "@/lib/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clerk = await clerkClient();
  const me = await clerk.users.getUser(userId);
  if (!isMaster(me.publicMetadata)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as {
    targetUserId: string;
    personType: "PF" | "PJ";
    fullName?: string; cpf?: string;
    companyName?: string; cnpj?: string;
    cep: string; street: string; number: string;
    complement?: string; district: string; city: string; state: string;
  };

  const { targetUserId, ...profileData } = body;
  if (!targetUserId) return NextResponse.json({ error: "targetUserId obrigatório" }, { status: 400 });

  const prisma = getPrisma();

  const profile = await prisma.fiscalProfile.upsert({
    where: { ownerId: targetUserId },
    update: { ...profileData },
    create: { ownerId: targetUserId, ...profileData },
  });

  // Sincroniza com Stripe se o customer existir
  try {
    const sub = await prisma.subscription.findUnique({ where: { ownerId: targetUserId } });
    const customerId = sub?.stripeCustomerId;
    if (customerId) {
      const stripe = getStripe();
      const name = profileData.personType === "PF" ? (profileData.fullName ?? "") : (profileData.companyName ?? "");
      const taxNumber = profileData.personType === "PF"
        ? (profileData.cpf ?? "").replace(/\D/g, "")
        : (profileData.cnpj ?? "").replace(/\D/g, "");
      const taxType = profileData.personType === "PF" ? "br_cpf" : "br_cnpj";

      await stripe.customers.update(customerId, {
        name,
        address: {
          line1: `${profileData.street}, ${profileData.number}`,
          line2: profileData.complement ?? profileData.district,
          city: profileData.city,
          state: profileData.state,
          postal_code: profileData.cep.replace(/\D/g, ""),
          country: "BR",
        },
        metadata: { borrowerFederalTaxNumber: taxNumber, borrowerName: name },
      });

      if (taxNumber) {
        const existing = await stripe.customers.listTaxIds(customerId);
        await Promise.all(existing.data.map(t => stripe.customers.deleteTaxId(customerId, t.id)));
        await stripe.customers.createTaxId(customerId, { type: taxType as "br_cpf" | "br_cnpj", value: taxNumber });
      }
    }
  } catch (err) {
    console.error("[admin/fiscal-profile] Stripe sync error:", err);
  }

  return NextResponse.json({ ok: true, profile });
}
