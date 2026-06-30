export type PlanId = "BASIC" | "ADVANCED" | "PROFESSIONAL";

export const PLANS: Record<PlanId, { label: string; priceCents: number; credits: number; tierAIncluded: number; brandsLimit: number; stripePriceId: string }> = {
  BASIC:        { label: "Básico",       priceCents: 100_000, credits: 200,   tierAIncluded: 2,  brandsLimit: 2,  stripePriceId: "price_1To82d49GuLk7UE9uuXtr9dj" },
  ADVANCED:     { label: "Avançado",     priceCents: 200_000, credits: 500,   tierAIncluded: 5,  brandsLimit: 5,  stripePriceId: "price_1To82e49GuLk7UE9j414djx8" },
  PROFESSIONAL: { label: "Profissional", priceCents: 300_000, credits: 1_000, tierAIncluded: 10, brandsLimit: 10, stripePriceId: "price_1To82e49GuLk7UE9u21XooHv" },
};

export const TIER_TOKENS: Record<string, number> = { A: 100, B: 60, C: 40, D: 20, E: 0 };
