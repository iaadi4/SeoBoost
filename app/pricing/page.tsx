'use client'

import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  X,
  Zap,
  ArrowRight,
  Loader2,
  Sparkles,
  Lock,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

// Floating background orb
function Orb({
  className,
  delay = 0,
  duration = 8,
}: {
  className: string
  delay?: number
  duration?: number
}) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{
        y: [-20, 20, -20],
        x: [-10, 10, -10],
        opacity: [0.4, 0.6, 0.4],
      }}
      transition={{ duration, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  )
}

const features = [
  { name: 'Scans (total / monthly)', free: '3 lifetime', pro: 'Unlimited' },
  { name: 'Pages crawled per scan', free: '5', pro: '5' },
  { name: 'SEO Health Score (A–F)', free: true, pro: true },
  { name: 'Title, meta & canonical checks', free: true, pro: true },
  { name: 'Social (OG + Twitter Cards)', free: true, pro: true },
  { name: 'Content & heading analysis', free: true, pro: true },
  { name: 'Accessibility (WCAG) audit', free: false, pro: true },
  { name: 'Performance & Core Web Vitals', free: false, pro: true },
  { name: 'Security headers analysis', free: false, pro: true },
  { name: 'Structured data / JSON-LD', free: false, pro: true },
  { name: 'Internal link graph analysis', free: false, pro: true },
  { name: 'Image optimisation insights', free: false, pro: true },
  { name: 'AI-ready prompt export', free: false, pro: true },
  { name: 'Export report to PDF', free: false, pro: true },
]

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true)
    return <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
  if (value === false)
    return <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />
  return <span className="text-sm font-medium">{value}</span>
}

function LimitBanner() {
  const params = useSearchParams()
  if (params.get('limit') !== 'reached') return null
  return (
    <motion.div
      variants={item}
      className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/8 p-4 flex items-center gap-3"
    >
      <Lock className="h-5 w-5 text-amber-500 shrink-0" />
      <p className="text-sm font-medium">
        You&apos;ve used all 3 free scans. Subscribe to Pro for{' '}
        <span className="text-primary font-bold">$9/mo</span> and scan unlimited
        domains — cancel any time.
      </p>
    </motion.div>
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
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-8 h-14 flex items-center justify-between max-w-6xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shadow-md shadow-primary/30">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base tracking-tight">
              SEO Boost
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Dashboard
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <motion.div
          className="container relative mx-auto px-4 sm:px-8 max-w-5xl py-20"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Background orbs for "living" feel */}
          <Orb
            className="w-[500px] h-[500px] bg-primary/10 -top-40 -left-60"
            delay={0}
            duration={12}
          />
          <Orb
            className="w-[400px] h-[400px] bg-primary/8 top-60 -right-40"
            delay={2}
            duration={15}
          />

          {/* Limit banner */}
          <Suspense>
            <LimitBanner />
          </Suspense>

          {/* Hero */}
          <motion.div variants={item} className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full mb-6">
              Simple Pricing
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Simple Pricing.{' '}
              <span className="text-primary">Unlimited Scans.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Start free with 3 total scans. Go Pro for $9/mo and run unlimited
              audits across any domain — cancel any time.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <motion.div
            variants={item}
            className="grid md:grid-cols-2 gap-6 mb-16 max-w-3xl mx-auto"
          >
            {/* Free */}
            <div className="rounded-2xl border border-border/60 bg-card p-8 flex flex-col">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Hobby
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-extrabold">$0</span>
                  <span className="text-muted-foreground mb-1">forever</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Try it out with 3 scans
                </p>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {[
                  '3 scans total',
                  'Full SEO Health Score',
                  'Title & Meta tag checks',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className="w-full">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-xl border-border/80 hover:border-primary/50 hover:text-primary transition-all"
                >
                  Current Plan
                </Button>
              </Link>
            </div>

            {/* Pro — $9 one-time */}
            <div
              className="relative rounded-2xl bg-card flex flex-col overflow-hidden"
              style={{
                boxShadow:
                  '0 0 0 1px rgba(62,207,142,0.35), 0 8px 48px -8px rgba(62,207,142,0.25)',
              }}
            >
              <div className="absolute inset-0 rounded-2xl border border-primary/50 pointer-events-none" />
              {/* Popular badge */}
              <div className="absolute -top-px left-0 right-0 flex justify-center">
                <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-b-lg shadow-md shadow-primary/30 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Best Value
                </span>
              </div>
              <div className="p-8 pt-10 flex flex-col flex-1">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
                    Pro
                  </p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-5xl font-extrabold text-primary">
                      $9
                    </span>
                    <span className="text-muted-foreground mb-1">/mo</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Unlimited scans. Cancel any time.
                  </p>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {[
                    'Unlimited scans',
                    '5 pages crawled per scan',
                    '45+ detailed SEO checks',
                    'Performance & Core Web Vitals',
                    'Accessibility (WCAG) audit',
                    'Security headers analysis',
                    'Structured data / JSON-LD',
                    'Image & link optimisation',
                    'AI-ready prompt export',
                    'PDF report export',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  className="w-full rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all gap-2"
                  onClick={() =>
                    handleSubscribe(
                      process.env.NEXT_PUBLIC_DODO_PRODUCT_ID || 'pdt_123456'
                    )
                  }
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      Subscribe — $9/mo <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Secure payment via DodoPayments
                </p>
              </div>
            </div>
          </motion.div>

          {/* Feature Comparison Table */}
          <motion.div variants={item}>
            <h2 className="text-xl font-bold text-center mb-6">
              What&apos;s included
            </h2>
            <div className="rounded-2xl border border-border/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="text-left px-6 py-4 font-semibold text-muted-foreground">
                      Feature
                    </th>
                    <th className="text-center px-6 py-4 font-semibold w-28">
                      Hobby
                    </th>
                    <th className="text-center px-6 py-4 font-semibold text-primary w-28">
                      Pro
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, i) => (
                    <tr
                      key={feature.name}
                      className={`border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                    >
                      <td className="px-6 py-3.5 text-muted-foreground">
                        {feature.name}
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
          </motion.div>

          <motion.div variants={item} className="mt-12 text-center">
            <p className="text-muted-foreground text-sm">
              Questions?{' '}
              <a
                href="mailto:hello@seoboost.app"
                className="text-primary hover:underline"
              >
                hello@seoboost.app
              </a>
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}

export default function PricingPage() {
  return <PricingContent />
}
