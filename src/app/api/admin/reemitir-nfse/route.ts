/**
 * ROTA TEMPORÁRIA — remover após uso
 * Re-emite NFS-e com falha no NFe.io usando dados fiscais do banco/Stripe.
 *
 * POST /api/admin/reemitir-nfse
 * Body: { dryRun?: boolean }
 *
 * Só admins podem chamar. Busca notas com status Error no NFe.io,
 * cruza com FiscalProfile do banco, e re-emite com dados corretos.
 */
export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { assertAnyAdmin } from "@/lib/admin-server";

const NFEIO_KEY    = "qzYyaJxTz7zgRs9sdxhIUpDPwWLIXqsVnHvX0NWNVcUk1cVkBqvaC4Z3zjbkT1kHfhK";
const COMPANY_ID   = "796880a7bfb7407db2201ffee964b4ef";
const NFEIO_BASE   = "https://api.nfe.io/v1";

async function nfeGet(path: string) {
  const res = await fetch(`${NFEIO_BASE}${path}`, {
    headers: { Authorization: NFEIO_KEY },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`NFe.io GET ${path} → ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function nfePost(path: string, body: object) {
  const res = await fetch(`${NFEIO_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${NFEIO_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`NFe.io POST ${path} → ${res.status}: ${text}`);
  return JSON.parse(text);
}

export async function POST(req: Request) {
  if (!await assertAnyAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    return await _handlePost(req);
  } catch (err) {
    console.error("[reemitir-nfse] Erro não tratado:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET — diagnóstico: lista empresas disponíveis na conta NFe.io
export async function GET() {
  if (!await assertAnyAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const res = await fetch(`${NFEIO_BASE}/companies`, {
      headers: { Authorization: NFEIO_KEY },
    });
    const text = await res.text();
    return NextResponse.json({ status: res.status, body: text });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

async function _handlePost(req: Request) {
  const { dryRun = false } = await req.json().catch(() => ({})) as { dryRun?: boolean };
  const prisma = getPrisma();
  const stripe = getStripe();
  // Apenas estes dois destinatários, uma nota cada
  const ALLOWED: Record<string, true> = {
    "rodrigo@jvmc.com.br": true,
    "fersouzafilho@gmail.com": true,
  };
  const emitted = new Set<string>(); // controla: apenas 1 nota por email

  const log: string[] = [];

  // 1. Lista notas com erro no NFe.io
  const data = await nfeGet(`/companies/${COMPANY_ID}/serviceinvoices?status=Error&pageSize=50`);
  const invoices = data.serviceInvoices ?? data.data ?? [];
  log.push(`NFe.io: ${invoices.length} notas com erro encontradas`);

  const results = [];

  for (const inv of invoices) {
    const email: string = inv.borrower?.email ?? "";
    if (!email) { log.push(`Pulando nota sem email: ${inv.id}`); continue; }

    if (!ALLOWED[email]) { log.push(`Pulando (não autorizado): ${email}`); continue; }
    if (emitted.has(email)) { log.push(`Pulando (já emitido uma nota): ${email}`); continue; }

    log.push(`\n→ ${email} | R$ ${inv.servicesAmount} | id: ${inv.id}`);

    // 2. Stripe customer pelo email
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0];
    if (!customer) {
      log.push(`  ✗ Customer não encontrado no Stripe`);
      results.push({ email, status: "no_stripe_customer" });
      continue;
    }
    log.push(`  Stripe: ${customer.id} (${customer.name})`);

    // 3. Subscription → ownerId → FiscalProfile
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
      log.push(`  ✗ FiscalProfile não encontrado — dados fiscais ainda não cadastrados`);
      results.push({ email, status: "no_fiscal_profile" });
      continue;
    }

    const isPJ = fp.personType === "PJ";
    const taxNumber = isPJ
      ? (fp.cnpj ?? "").replace(/\D/g, "")
      : (fp.cpf  ?? "").replace(/\D/g, "");

    if (!taxNumber) {
      log.push(`  ✗ CPF/CNPJ vazio no FiscalProfile`);
      results.push({ email, status: "empty_tax_number" });
      continue;
    }

    log.push(`  FiscalProfile: ${fp.personType} | doc: ${taxNumber}`);

    const payload = {
      cityServiceCode: "6202300",
      description: inv.description ?? "Assinatura de plataforma digital — Raio Publicador",
      servicesAmount: inv.servicesAmount,
      borrower: {
        federalTaxNumber: taxNumber,
        name: isPJ ? fp.companyName : fp.fullName,
        email,
        address: {
          country: "BRA",
          postalCode: (fp.cep ?? "").replace(/\D/g, ""),
          street: fp.street ?? "",
          number: fp.number ?? "",
          additionalInformation: fp.complement ?? fp.district ?? "",
          district: fp.district ?? "",
          city: { name: fp.city ?? "" },
          state: fp.state ?? "",
        },
      },
    };

    if (dryRun) {
      log.push(`  [DRY RUN] Payload pronto, não emitindo`);
      results.push({ email, status: "dry_run", payload });
      continue;
    }

    try {
      const result = await nfePost(`/companies/${COMPANY_ID}/serviceinvoices`, payload);
      log.push(`  ✓ Nova NFS-e: id=${result.id} status=${result.flowStatus ?? result.status}`);
      results.push({ email, status: "emitted", nfseId: result.id, flowStatus: result.flowStatus });
      emitted.add(email);
    } catch (err) {
      log.push(`  ✗ Erro ao emitir: ${String(err)}`);
      results.push({ email, status: "error", error: String(err) });
    }
  }

  return NextResponse.json({ log: log.join("\n"), results });
}
