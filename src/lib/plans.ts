export type PlanId = "BASIC" | "ADVANCED" | "PROFESSIONAL" | "VOUCHER";

export const PLANS: Record<PlanId, { label: string; priceCents: number; credits: number; tierAIncluded: number; brandsLimit: number; editorsLimit: number; reviewersLimit: number; stripePriceId: string }> = {
  BASIC:        { label: "Básico",       priceCents: 100_000, credits: 200,   tierAIncluded: 2,  brandsLimit: 2,  editorsLimit: 1,  reviewersLimit: 1,  stripePriceId: process.env.STRIPE_PRICE_BASIC        ?? "price_1U5vfXBrkabOn5UcgHiXZHk9" },
  ADVANCED:     { label: "Avançado",     priceCents: 300_000, credits: 1_000, tierAIncluded: 5,  brandsLimit: 5,  editorsLimit: 3,  reviewersLimit: 5,  stripePriceId: process.env.STRIPE_PRICE_ADVANCED     ?? "price_1U5vfXBrkabOn5Uc5M1eqZTY" },
  PROFESSIONAL: { label: "Profissional", priceCents: 500_000, credits: 2_000, tierAIncluded: 10, brandsLimit: 10, editorsLimit: 5,  reviewersLimit: 10, stripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL ?? "price_1U5vfXBrkabOn5UcSkCFBV9s" },
  VOUCHER:      { label: "Voucher",      priceCents: 0,       credits: 100,   tierAIncluded: 1,  brandsLimit: 1,  editorsLimit: 0,  reviewersLimit: 0,  stripePriceId: "" },
};

export const TIER_TOKENS: Record<string, number> = { A: 100, B: 50, C: 25 };
