import { dodopayments } from '@/lib/dodopayments'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.text()
  // DodoPayments SDK requires a plain Record<string, string>, not the Web API Headers object
  const headersRecord: Record<string, string> = Object.fromEntries(
    req.headers.entries()
  )

  try {
    // Verify the webhook using the DodoPayments SDK
    const event = await dodopayments.webhooks.unwrap(body, {
      headers: headersRecord,
    })

    if (event.type === 'payment.succeeded') {
      const payload = event.data

      // Ensure this payment corresponds to an active customer
      if (payload.customer && payload.customer.customer_id) {
        // Update the user status to "pro" matching the customer ID
        await prisma.user.update({
          where: {
            dodoCustomerId: payload.customer.customer_id,
          },
          data: {
            subscriptionPlan: 'pro',
          },
        })
      }
    } else if (event.type === 'payment.failed') {
      const payload = event.data

      // Handle failed payment event
      if (payload.customer && payload.customer.customer_id) {
        await prisma.user.update({
          where: {
            dodoCustomerId: payload.customer.customer_id,
          },
          data: {
            subscriptionPlan: 'free',
          },
        })
      }
    }

    return new NextResponse(null, { status: 200 })
  } catch (error: unknown) {
    const err = error as Error
    console.error(`Webhook signature verification failed.`, err.message)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }
}
