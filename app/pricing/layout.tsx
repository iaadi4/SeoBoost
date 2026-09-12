import { Metadata } from 'next'
import { JsonLd, breadcrumbList } from '@/lib/json-ld'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Affordable Pro plan for unlimited SEO technical audits. Start free, upgrade when you need more scans.',
  alternates: {
    canonical: '/pricing',
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd
        data={breadcrumbList([
          { name: 'Home', path: '/' },
          { name: 'Pricing' },
        ])}
      />
      {children}
    </>
  )
}
