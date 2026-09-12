'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-chrome'
import { PaperGlow } from '@/components/seo-art'
import { HOBBY_MAX_PAGES, PRO_MAX_PAGES } from '@/lib/crawl-limits'
import { AccountWidgets } from './account-widgets'
import { ReportList, ReportsEmpty } from './report-list'
import {
  FREE_SCAN_LIMIT,
  hobbyScansRemaining,
  type ReportListItem,
} from './report-list-data'

interface Props {
  userName: string
  subscriptionPlan: string
  totalScans: number
  avgScore: number | null
  recentReports: ReportListItem[]
  children: React.ReactNode
}

export function DashboardClient({
  userName,
  subscriptionPlan,
  totalScans,
  avgScore,
  recentReports,
  children,
}: Props) {
  const isPro = subscriptionPlan === 'pro'
  const scansRemaining = isPro ? null : hobbyScansRemaining(totalScans)
  const limitReached = !isPro && totalScans >= FREE_SCAN_LIMIT
  const pageCap = isPro ? PRO_MAX_PAGES : HOBBY_MAX_PAGES

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader signedIn variant="app" />

      <div className="relative container mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <PaperGlow className="opacity-70" />

        <div className="mb-8">
          <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Welcome back
          </p>
          <h1 className="font-display text-3xl tracking-tight">Hey, {userName}</h1>
        </div>

        {limitReached && (
          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-border bg-card p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                You&apos;ve used all {FREE_SCAN_LIMIT} Hobby scans
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Pro is $9/mo — unlimited scans, {PRO_MAX_PAGES} pages each.
              </p>
            </div>
            <Link href="/pricing">
              <Button size="sm">Upgrade — $9</Button>
            </Link>
          </div>
        )}

        <AccountWidgets
          totalScans={totalScans}
          avgScore={avgScore}
          subscriptionPlan={subscriptionPlan}
        />

        <div
          id="scan"
          className="mb-10 scroll-mt-24 overflow-hidden rounded-3xl border border-border bg-card"
        >
          <div className="p-8">
            <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-display text-2xl">New domain scan</h2>
              <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {isPro
                  ? `${pageCap} page cap`
                  : `${scansRemaining}/${FREE_SCAN_LIMIT} scans · ${pageCap} pages`}
              </span>
            </div>
            <p className="mb-6 max-w-lg text-sm text-muted-foreground">
              HTML technical audit. Hobby fetches up to {HOBBY_MAX_PAGES} pages;
              Pro fetches up to {PRO_MAX_PAGES}.
            </p>
            {limitReached ? (
              <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Hobby scan limit reached.{' '}
                <Link href="/pricing" className="text-foreground underline underline-offset-4">
                  Upgrade for $9
                </Link>{' '}
                to scan unlimited domains.
              </div>
            ) : (
              children
            )}
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl">Recent reports</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              3 most recent scans
            </p>
          </div>
          <Link href="/dashboard/reports">
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <ReportsEmpty
            heading="No reports yet"
            body={`Run your first HTML scan. Hobby covers ${HOBBY_MAX_PAGES} pages per domain; Pro covers ${PRO_MAX_PAGES}.`}
            ctaHref={limitReached ? '/pricing' : '#scan'}
            ctaLabel={limitReached ? 'Upgrade to scan' : 'Scan a domain'}
          />
        ) : (
          <ReportList reports={recentReports} />
        )}
      </div>
    </div>
  )
}
