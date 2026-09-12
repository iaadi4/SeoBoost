import { createClient } from '@/utils/supabase/server'
import { dodopayments } from '@/lib/dodopayments'
import prisma from '@/lib/prisma'
import { SITE_ORIGIN } from '@/lib/site'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { productId } = await req.json()

    if (!productId) {
      return new NextResponse('Product ID is required', { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { dodoCustomerId: true, email: true, name: true },
    })

    if (!dbUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    let customerId = dbUser.dodoCustomerId

    if (!customerId) {
      // Create a new DodoPayments Customer
      const customer = await dodopayments.customers.create({
        email: dbUser.email,
        name: dbUser.name || 'Customer',
      })

      customerId = customer.customer_id

      await prisma.user.update({
        where: { id: user.id },
        data: { dodoCustomerId: customerId },
      })
    }

    // Create a DodoPayment payment session url map
    const payment = await dodopayments.payments.create({
      billing: {
        city: '',
        country: 'US', // Defaulting to US, user fills the rest
        state: '',
        street: '',
        zipcode: '',
      },
      customer: {
        customer_id: customerId as string,
      },
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      payment_link: true,
      return_url: `${SITE_ORIGIN}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    })

    // We can also attach metadata during creation if supported, but typically customer mapping is enough.

    const checkoutUrl = payment.payment_link || (payment as unknown as Record<string, unknown>).checkout_url || (payment as unknown as Record<string, unknown>).payment_url
    
    if (!checkoutUrl) {
      console.error('No checkout URL found in Dodo response:', payment)
      return new NextResponse('Checkout URL not found', { status: 500 })
    }

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error('DodoPayments error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
