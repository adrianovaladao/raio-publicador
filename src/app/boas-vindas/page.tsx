import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PLANS, type PlanId } from "@/lib/plans";
import { getPrisma } from "@/lib/prisma";
import BoasVindasClient from "./BoasVindasClient";
import CheckoutConfirmClient from "./CheckoutConfirmClient";

const VALID_PLANS: PlanId[] = ["BASIC", "ADVANCED", "PROFESSIONAL"];

export default async function BoasVindasPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; checkout?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const { plan: planParam, checkout } = await searchParams;

  // Arrived from Stripe success or no plan param — show onboarding
  if (checkout === "success" || !planParam || !VALID_PLANS.includes(planParam as PlanId)) {
    return <BoasVindasClient />;
  }

  // Has a plan param — check if already has active subscription
  const planId = planParam as PlanId;
  const prisma = getPrisma();
  const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });

  if (sub && !["INACTIVE", "CANCELLED"].includes(sub.status)) {
    return <BoasVindasClient />;
  }

  const plan = PLANS[planId];
  const priceBRL = (plan.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <CheckoutConfirmClient
      planId={planId}
      label={plan.label}
      priceBRL={priceBRL}
      credits={plan.credits}
      brandsLimit={plan.brandsLimit}
      editorsLimit={plan.editorsLimit}
      reviewersLimit={plan.reviewersLimit}
      tierAIncluded={plan.tierAIncluded}
    />
  );
}
