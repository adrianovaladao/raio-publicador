export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { assertMaster } from "@/lib/admin-server";

export async function POST() {
  if (!await assertMaster())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const prisma = getPrisma();
  const stripe = getStripe();

  const profiles = await prisma.fiscalProfile.findMany();
  const subs = await prisma.subscription.findMany({
    where: { ownerId: { in: profiles.map(p => p.ownerId) } },
    select: { ownerId: true, stripeCustomerId: true },
  });
  const subMap = new Map(subs.map(s => [s.ownerId, s.stripeCustomerId]));

  const results: { email?: string; ownerId: string; status: "ok" | "skip" | "error"; reason?: string }[] = [];

  for (const p of profiles) {
    const customerId = subMap.get(p.ownerId);
    if (!customerId) {
      results.push({ ownerId: p.ownerId, status: "skip", reason: "sem stripeCustomerId" });
      continue;
    }

    try {
      const name = p.personType === "PF"
        ? (p.fullName ?? "")
        : (p.companyName ?? "");
      const taxNumber = p.personType === "PF"
        ? (p.cpf ?? "").replace(/\D/g, "")
        : (p.cnpj ?? "").replace(/\D/g, "");
      const taxType = p.personType === "PF" ? "br_cpf" : "br_cnpj";

      await stripe.customers.update(customerId, {
        name,
        address: {
          line1: `${p.street}, ${p.number}`,
          line2: p.district,
          city: p.city,
          state: p.state,
          postal_code: p.cep.replace(/\D/g, ""),
          country: "BR",
        },
        metadata: {
          borrowerFederalTaxNumber: taxNumber,
          borrowerName: name,
        },
      });

      if (taxNumber) {
        const existingTaxIds = await stripe.customers.listTaxIds(customerId);
        await Promise.all(
          existingTaxIds.data.map(tid => stripe.customers.deleteTaxId(customerId, tid.id))
        );
        await stripe.customers.createTaxId(customerId, {
          type: taxType as "br_cpf" | "br_cnpj",
          value: taxNumber,
        });
      }

      results.push({ ownerId: p.ownerId, status: "ok" });
    } catch (err) {
      const msg = String(err);
      // Customer não existe no Stripe — limpa o ID inválido do banco
      if (msg.includes("No such customer")) {
        await prisma.subscription.updateMany({
          where: { ownerId: p.ownerId },
          data: { stripeCustomerId: null },
        });
        results.push({ ownerId: p.ownerId, status: "skip", reason: "customer inválido no Stripe — ID removido do banco" });
      } else {
        results.push({ ownerId: p.ownerId, status: "error", reason: msg });
      }
    }
  }

  const ok    = results.filter(r => r.status === "ok").length;
  const skip  = results.filter(r => r.status === "skip").length;
  const error = results.filter(r => r.status === "error").length;

  return NextResponse.json({ ok, skip, error, details: results });
}
