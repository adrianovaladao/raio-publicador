export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ paymentType: "unknown" });

  const prisma = getPrisma();
  const sub = await prisma.subscription.findUnique({ where: { ownerId: userId } });
  if (!sub?.stripeSubscriptionId) return NextResponse.json({ paymentType: "unknown" });

  try {
    const stripe = getStripe();
    const invoices = await stripe.invoices.list({ subscription: sub.stripeSubscriptionId, limit: 1 });
    const lastInvoice = invoices.data[0] as unknown as { payment_intent?: string | null };
    if (!lastInvoice?.payment_intent || typeof lastInvoice.payment_intent !== "string") {
      return NextResponse.json({ paymentType: "unknown" });
    }
    const pi = await stripe.paymentIntents.retrieve(lastInvoice.payment_intent, {
      expand: ["charges.data.payment_method_details"],
    });
    const type = (pi as { charges?: { data?: Array<{ payment_method_details?: { type?: string } }> } })
      .charges?.data?.[0]?.payment_method_details?.type ?? "unknown";
    return NextResponse.json({ paymentType: type });
  } catch {
    return NextResponse.json({ paymentType: "unknown" });
  }
}
