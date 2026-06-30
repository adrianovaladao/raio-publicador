import Stripe from "stripe";
import { readFileSync } from "fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf-8");
const secretKey = env.match(/STRIPE_SECRET_KEY="(.+)"/)?.[1];
if (!secretKey) throw new Error("STRIPE_SECRET_KEY não encontrada em .env.local");

const stripe = new Stripe(secretKey);

const PLANS = [
  { id: "BASIC",        name: "Raio Publicador — Básico",       priceCents: 100_000 },
  { id: "ADVANCED",     name: "Raio Publicador — Avançado",     priceCents: 200_000 },
  { id: "PROFESSIONAL", name: "Raio Publicador — Profissional", priceCents: 300_000 },
];

for (const plan of PLANS) {
  const product = await stripe.products.create({
    name: plan.name,
    metadata: { planId: plan.id },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: plan.priceCents,
    currency: "brl",
    recurring: { interval: "month" },
  });

  console.log(`${plan.id}: product=${product.id} price=${price.id}`);
}
