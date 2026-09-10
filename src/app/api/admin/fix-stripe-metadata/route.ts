/**
 * ROTA TEMPORÁRIA — remover após uso
 * Atualiza metadata do Stripe com campos que o NFe.io lê para emitir NFS-e.
 * O NFe.io lê customer.metadata.borrowerFederalTaxNumber, não os tax_ids nativos.
 *
 * POST /api/admin/fix-stripe-metadata
 * Body: { dryRun?: boolean }
 */
export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { assertAnyAdmin } from "@/lib/admin-server";

const TARGETS = ["rodrigo@jvmc.com.br", "fersouzafilho@gmail.com"];

export async function POST(req: Request) {
  if (!await assertAnyAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { dryRun = false } = await req.json().catch(() => ({})) as { dryRun?: boolean };
  const prisma = getPrisma();
  const stripe = getStripe();
  const log: string[] = [];
  const results = [];

  for (const email of TARGETS) {
    log.push(`\n→ ${email}`);

    // 1. Stripe customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0];
    if (!customer) {
      log.push(`  ✗ Customer não encontrado no Stripe`);
      results.push({ email, status: "no_customer" });
      continue;
    }
    log.push(`  Stripe: ${customer.id} (${customer.name})`);

    // 2. FiscalProfile via subscription
    const sub = await prisma.subscription.findFirst({
      where: { stripeCustomerId: customer.id },
      select: { ownerId: true },
    });
    if (!sub) {
      log.push(`  ✗ Subscription não encontrada`);
      results.push({ email, status: "no_subscription" });
      continue;
    }

    const fp = await prisma.fiscalProfile.findUnique({ where: { ownerId: sub.ownerId } });
    if (!fp) {
      log.push(`  ✗ FiscalProfile não encontrado`);
      results.push({ email, status: "no_fiscal_profile" });
      continue;
    }

    const isPJ = fp.personType === "PJ";
    const taxNumber = isPJ
      ? (fp.cnpj ?? "").replace(/\D/g, "")
      : (fp.cpf  ?? "").replace(/\D/g, "");
    const name = isPJ ? (fp.companyName ?? "") : (fp.fullName ?? "");

    if (!taxNumber) {
      log.push(`  ✗ CPF/CNPJ vazio`);
      results.push({ email, status: "empty_tax_number" });
      continue;
    }

    log.push(`  FiscalProfile: ${fp.personType} | doc: ${taxNumber} | name: ${name}`);
    log.push(`  metadata atual: borrowerFederalTaxNumber=${customer.metadata?.borrowerFederalTaxNumber ?? "(vazio)"}`);

    if (dryRun) {
      log.push(`  [DRY RUN] Atualizaria metadata com borrowerFederalTaxNumber=${taxNumber}`);
      results.push({ email, status: "dry_run", taxNumber, name });
      continue;
    }

    // 3. Atualiza metadata no Stripe
    await stripe.customers.update(customer.id, {
      name,
      metadata: {
        ...customer.metadata,
        borrowerFederalTaxNumber: taxNumber,
        borrowerName: name,
        borrowerEmail: email,
      },
    });

    log.push(`  ✓ Metadata atualizado: borrowerFederalTaxNumber=${taxNumber}`);
    results.push({ email, status: "updated", customerId: customer.id, taxNumber });
  }

  return NextResponse.json({ log: log.join("\n"), results });
}
