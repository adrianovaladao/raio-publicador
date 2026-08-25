import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PLANS, type PlanId } from "@/lib/plans";
import { getPrisma } from "@/lib/prisma";
import BoasVindasClient from "./BoasVindasClient";
import CheckoutConfirmClient from "./CheckoutConfirmClient";

const VALID_PLANS: PlanId[] = ["BASIC", "ADVANCED", "PROFESSIONAL"];

export default async function BoasVindasPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; checkout?: string; vc?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const { plan: planParam, checkout } = await searchParams;

  // Arrived from Stripe success, voucher flow, or no plan param — show onboarding
  if (checkout === "success" || checkout === "voucher" || !planParam || !VALID_PLANS.includes(planParam as PlanId)) {
    return <Suspense><BoasVindasClient /></Suspense>;
  }

  // Has a plan param — check if already has active subscription
  const planId = planParam as PlanId;
  const prisma = getPrisma();
  const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });

  if (sub && !["INACTIVE", "CANCELLED"].includes(sub.status)) {
    return <Suspense><BoasVindasClient /></Suspense>;
  }

  const fmt = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const allPlans = (["BASIC", "ADVANCED", "PROFESSIONAL"] as PlanId[]).map((id) => {
    const p = PLANS[id];
    return { id, label: p.label, priceBRL: fmt(p.priceCents), priceCents: p.priceCents, credits: p.credits, brandsLimit: p.brandsLimit, editorsLimit: p.editorsLimit, reviewersLimit: p.reviewersLimit, tierAIncluded: p.tierAIncluded };
  });

  const plan = PLANS[planId];

  return (
    <CheckoutConfirmClient
      initialPlanId={planId}
      allPlans={allPlans}
      initialPriceBRL={fmt(plan.priceCents)}
    />
  );
}
