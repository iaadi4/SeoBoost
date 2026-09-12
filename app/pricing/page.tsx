'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { FEATURE_CLAIMS, HOBBY_BULLETS, PRO_BULLETS } from '@/lib/claims'
import { SiteHeader } from '@/components/site-chrome'
import { PaperGlow } from '@/components/seo-art'
import { MarketingPhoto } from '@/components/marketing-photo'

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true)
    return <span className="mx-auto block h-2 w-2 rounded-full bg-index" />
  if (value === false)
    return <span className="mx-auto block h-2 w-2 rounded-full bg-border" />
  return <span className="text-sm font-medium">{value}</span>
}

function LimitBanner() {
  const params = useSearchParams()
  if (params.get('limit') !== 'reached') return null
  return (
    <div className="mb-8 rounded-3xl border border-border bg-card px-5 py-4 text-sm">
      You&apos;ve used all 3 free scans. Subscribe to Pro for{' '}
      <span className="font-medium text-foreground">$9/mo</span> and scan
      unlimited domains — cancel any time.
    </div>
  )
}

function PricingContent() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async (productId: string) => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (error) {
      console.error('Payment failed', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="relative flex-1">
        <PaperGlow />
        <div className="container relative mx-auto max-w-5xl px-4 py-20 sm:px-8">
          <Suspense>
            <LimitBanner />
          </Suspense>

          <div className="mb-16 max-w-2xl">
            <p className="mb-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Pricing
            </p>
            <h1 className="font-display text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
              3 free scans. Pro is $9/mo.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Hobby fetches up to 50 pages. Pro fetches up to 500. Extra check
              groups, copy-as-prompt, and PDF export — cancel any time.
            </p>
          </div>
          <MarketingPhoto
            src="/images/hero-product.png"
            alt="Laptop on a cream desk showing a large B health grade"
            width={1600}
            height={900}
            className="mb-16 aspect-[16/9]"
            sizes="(min-width: 1024px) 64rem, 100vw"
          />

          <div className="mx-auto mb-16 grid max-w-3xl gap-4 md:grid-cols-2">
            <div className="flex flex-col rounded-3xl border border-border bg-card p-8">
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Hobby
              </p>
              <div className="mb-1 flex items-end gap-1">
                <span className="font-display text-5xl">$0</span>
                <span className="mb-1 text-muted-foreground">forever</span>
              </div>
              <p className="mb-6 text-sm text-muted-foreground">
                Try it out with 3 scans
              </p>
              <ul className="mb-8 flex-1 space-y-3 text-sm">
                {HOBBY_BULLETS.slice(0, 3).map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-index" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className="w-full">
                <Button variant="outline" size="lg" className="w-full">
                  Current plan
                </Button>
              </Link>
            </div>

            <div className="flex flex-col rounded-3xl border border-foreground/15 bg-card p-8">
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Pro
              </p>
              <div className="mb-1 flex items-end gap-1">
                <span className="font-display text-5xl">$9</span>
                <span className="mb-1 text-muted-foreground">/mo</span>
              </div>
              <p className="mb-6 text-sm text-muted-foreground">
                Unlimited scans. Cancel any time.
              </p>
              <ul className="mb-8 flex-1 space-y-3 text-sm">
                {PRO_BULLETS.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-index" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className="w-full"
                onClick={() =>
                  handleSubscribe(
                    process.env.NEXT_PUBLIC_DODO_PRODUCT_ID || 'pdt_123456'
                  )
                }
                disabled={isLoading}
              >
                {isLoading ? 'Processing…' : 'Subscribe — $9/mo'}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Secure payment via DodoPayments
              </p>
            </div>
          </div>

          <h2 className="mb-6 font-display text-2xl">What&apos;s included</h2>
          <div className="overflow-hidden rounded-3xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-6 py-4 text-left font-medium text-muted-foreground">
                    Feature
                  </th>
                  <th className="w-28 px-6 py-4 text-center font-medium">Hobby</th>
                  <th className="w-28 px-6 py-4 text-center font-medium">Pro</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_CLAIMS.map((feature) => (
                  <tr
                    key={feature.userLabel}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-6 py-3.5 text-muted-foreground">
                      {feature.userLabel}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <FeatureValue value={feature.free} />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <FeatureValue value={feature.pro} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-12 text-sm text-muted-foreground">
            Questions?{' '}
            <a href="mailto:hello@seoboost.app" className="underline underline-offset-4">
              hello@seoboost.app
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}

export default function PricingPage() {
  return <PricingContent />
}
