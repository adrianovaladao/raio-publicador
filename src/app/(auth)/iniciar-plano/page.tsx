import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe";
import { getPrisma } from "@/lib/prisma";
import { PLANS, type PlanId } from "@/lib/plans";

const VALID_PLANS: PlanId[] = ["BASIC", "ADVANCED", "PROFESSIONAL"];

export default async function IniciarPlanoPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const { plan: planParam } = await searchParams;
  const planId = planParam && VALID_PLANS.includes(planParam as PlanId) ? (planParam as PlanId) : null;
  if (!planId) redirect("/boas-vindas");

  const plan = PLANS[planId];
  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  const stripe = getStripe();
  const prisma = getPrisma();

  const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });

  // If already has active paid subscription, skip checkout
  if (sub && !["INACTIVE", "CANCELLED"].includes(sub.status)) {
    redirect("/dashboard");
  }

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

  if (!sub) {
    await prisma.subscription.create({
      data: {
        ownerId: userId,
        plan: planId,
        status: "INACTIVE",
        creditsTotal: plan.credits,
        stripeCustomerId: customerId,
      },
    });
  } else if (!sub.stripeCustomerId) {
    await prisma.subscription.update({
      where: { ownerId: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  redirect(session.url!);
}
