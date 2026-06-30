export type PlanId = "BASIC" | "ADVANCED" | "PROFESSIONAL";

export const PLANS: Record<PlanId, { label: string; priceCents: number; credits: number; tierAIncluded: number }> = {
  BASIC:        { label: "Básico",       priceCents: 100_000, credits: 200,   tierAIncluded: 2 },
  ADVANCED:     { label: "Avançado",     priceCents: 200_000, credits: 500,   tierAIncluded: 5 },
  PROFESSIONAL: { label: "Profissional", priceCents: 300_000, credits: 1_000, tierAIncluded: 10 },
};

export const TIER_TOKENS: Record<string, number> = { A: 100, B: 60, C: 40, D: 20, E: 0 };
