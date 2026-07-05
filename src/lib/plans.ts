export type PlanId = "BASIC" | "ADVANCED" | "PROFESSIONAL";

export const PLANS: Record<PlanId, { label: string; priceCents: number; credits: number; tierAIncluded: number; brandsLimit: number; editorsLimit: number; reviewersLimit: number; stripePriceId: string }> = {
  BASIC:        { label: "Básico",       priceCents: 100_000, credits: 200,   tierAIncluded: 2,  brandsLimit: 2,  editorsLimit: 1,  reviewersLimit: 1,  stripePriceId: process.env.STRIPE_PRICE_BASIC        ?? "price_1TpVcu3wGVab3Q0AB2Zqfpsm" },
  ADVANCED:     { label: "Avançado",     priceCents: 300_000, credits: 1_000, tierAIncluded: 5,  brandsLimit: 5,  editorsLimit: 3,  reviewersLimit: 5,  stripePriceId: process.env.STRIPE_PRICE_ADVANCED     ?? "price_1TpVcr3wGVab3Q0A1Ge8N90D" },
  PROFESSIONAL: { label: "Profissional", priceCents: 500_000, credits: 2_000, tierAIncluded: 10, brandsLimit: 10, editorsLimit: 5,  reviewersLimit: 10, stripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL ?? "price_1TpVcr3wGVab3Q0AzWOBCBeP" },
};

export const TIER_TOKENS: Record<string, number> = { A: 100, B: 50, C: 25 };
