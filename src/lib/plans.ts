export type PlanId = "BASIC" | "ADVANCED" | "PROFESSIONAL";

export const PLANS: Record<PlanId, { label: string; priceCents: number; credits: number; tierAIncluded: number; brandsLimit: number; stripePriceId: string }> = {
  BASIC:        { label: "Básico",       priceCents: 100_000, credits: 200,   tierAIncluded: 2,  brandsLimit: 2,  stripePriceId: "price_1To9AS49GuLk7UE9CwdRYXF8" },
  ADVANCED:     { label: "Avançado",     priceCents: 300_000, credits: 1_000, tierAIncluded: 5,  brandsLimit: 5,  stripePriceId: "price_1To9AS49GuLk7UE9fZ30HwkR" },
  PROFESSIONAL: { label: "Profissional", priceCents: 500_000, credits: 2_000, tierAIncluded: 10, brandsLimit: 10, stripePriceId: "price_1To9AT49GuLk7UE9uH2vQXnd" },
};

export const TIER_TOKENS: Record<string, number> = { A: 100, B: 60, C: 40, D: 20, E: 0 };
