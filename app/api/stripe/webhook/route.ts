import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: unknown) {
    const err = error as Error;
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    // Retrieve the subscription details from Stripe.
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    if (session?.metadata?.userId) {
      // Update the user status to "pro"
      await prisma.user.update({
        where: {
          id: session.metadata.userId,
        },
        data: {
          subscriptionPlan: "pro", // Update our DB
          stripeCustomerId: subscription.customer as string,
        },
      });
    }
  }

  if (event.type === "invoice.payment_succeeded") {
     const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // Update the price id and set the new period end.
    await prisma.user.update({
      where: {
        stripeCustomerId: subscription.customer as string,
      },
      data: {
        subscriptionPlan: "pro", 
      },
    });
  }

  return new NextResponse(null, { status: 200 });
}
