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

  // Busca todas as subscriptions que têm stripeCustomerId
  const subs = await prisma.subscription.findMany({
    where: { stripeCustomerId: { not: null } },
    select: { ownerId: true, stripeCustomerId: true },
  });

  const results: { ownerId: string; customerId: string; status: "ok" | "skip" | "error"; reason?: string }[] = [];

  for (const sub of subs) {
    const customerId = sub.stripeCustomerId!;

    try {
      const customer = await stripe.customers.retrieve(customerId, {
        expand: ["tax_ids"],
      }) as import("stripe").Stripe.Customer;

      if (customer.deleted) {
        results.push({ ownerId: sub.ownerId, customerId, status: "skip", reason: "customer deletado no Stripe" });
        continue;
      }

      const addr = customer.address;
      if (!addr || !addr.line1) {
        results.push({ ownerId: sub.ownerId, customerId, status: "skip", reason: "sem endereço no Stripe" });
        continue;
      }

      // Determina tipo de pessoa a partir dos tax_ids
      const taxIds = (customer.tax_ids as import("stripe").Stripe.ApiList<import("stripe").Stripe.TaxId>)?.data ?? [];
      const taxId = taxIds[0];
      const personType: "PF" | "PJ" = taxId?.type === "br_cnpj" ? "PJ" : "PF";

      const taxNumber = taxId?.value?.replace(/\D/g, "") ?? customer.metadata?.borrowerFederalTaxNumber ?? "";
      const name = customer.name ?? customer.metadata?.borrowerName ?? "";

      // Decompõe line1: "Rua Exemplo, 123"
      const line1Parts = (addr.line1 ?? "").split(",");
      const street = line1Parts[0]?.trim() ?? addr.line1 ?? "";
      const number = line1Parts[1]?.trim() ?? "s/n";

      const data = {
        personType,
        fullName:    personType === "PF" ? name : undefined,
        cpf:         personType === "PF" ? taxNumber : undefined,
        companyName: personType === "PJ" ? name : undefined,
        cnpj:        personType === "PJ" ? taxNumber : undefined,
        cep:         (addr.postal_code ?? "").replace(/\D/g, ""),
        street,
        number,
        complement:  addr.line2 && addr.line2 !== addr.line1 ? addr.line2 : undefined,
        district:    addr.line2 ?? "",
        city:        addr.city ?? "",
        state:       addr.state ?? "",
      };

      await prisma.fiscalProfile.upsert({
        where:  { ownerId: sub.ownerId },
        update: data,
        create: { ownerId: sub.ownerId, ...data },
      });

      results.push({ ownerId: sub.ownerId, customerId, status: "ok" });
    } catch (err) {
      results.push({ ownerId: sub.ownerId, customerId, status: "error", reason: String(err) });
    }
  }

  const ok    = results.filter(r => r.status === "ok").length;
  const skip  = results.filter(r => r.status === "skip").length;
  const error = results.filter(r => r.status === "error").length;

  return NextResponse.json({ ok, skip, error, details: results });
}
