import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe";
import { getPrisma } from "@/lib/prisma";
import { PLANS, type PlanId } from "@/lib/plans";
import BoasVindasClient from "./BoasVindasClient";

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
    // Already active — skip checkout
    return <BoasVindasClient />;
  }

  // Start Stripe checkout
  try {
    const plan = PLANS[planId];
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;
    const stripe = getStripe();

    let customerId = sub?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({ email, metadata: { clerkId: userId } });
      customerId = customer.id;
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://raiopublicador.com.br";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      currency: "brl",
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: `${origin}/boas-vindas?checkout=success`,
      cancel_url: `${origin}/site#planos`,
      locale: "pt-BR",
      metadata: { clerkId: userId, planId },
      subscription_data: { metadata: { clerkId: userId, planId } },
    });

    // Persist customer/subscription record
    if (!sub) {
      await prisma.subscription.create({
        data: { ownerId: userId, plan: planId, status: "INACTIVE", creditsTotal: plan.credits, stripeCustomerId: customerId },
      });
    } else if (!sub.stripeCustomerId) {
      await prisma.subscription.update({ where: { ownerId: userId }, data: { stripeCustomerId: customerId } });
    }

    redirect(session.url!);
  } catch (err) {
    // If it's a Next.js redirect, re-throw it
    if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.error("[boas-vindas] Stripe checkout error:", err);
    // Fall through to onboarding — user can subscribe later via plan modal
  }
}
