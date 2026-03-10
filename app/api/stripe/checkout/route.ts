import { createClient } from "@/utils/supabase/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { priceId } = await req.json();

    if (!priceId) {
      return new NextResponse("Price ID is required", { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true, email: true },
    });

    if (!dbUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    let customerId = dbUser.stripeCustomerId;

    if (!customerId) {
        // Create a new Stripe Customer
        const customer = await stripe.customers.create({
            email: dbUser.email,
            metadata: {
                userId: user.id,
            },
        });
        
        customerId = customer.id;

        await prisma.user.update({
            where: { id: user.id },
            data: { stripeCustomerId: customer.id },
        });
    }

    const stripeSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing`,
      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
