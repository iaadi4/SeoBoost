import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing | SEO Boost',
  description: 'Affordable, one-time payment for unlimited SEO technical audits. No monthly subscriptions, scan forever.',
  alternates: {
    canonical: '/pricing',
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
