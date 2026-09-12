'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/site-chrome'
import { PaperGlow } from '@/components/seo-art'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HOBBY_MAX_PAGES, PRO_MAX_PAGES } from '@/lib/crawl-limits'
import { AccountWidgets } from '../account-widgets'
import { ReportList, ReportsEmpty } from '../report-list'
import { type ReportListItem } from '../report-list-data'

type TimeFilter = 'all' | 'today' | 'week' | 'month'

export function ReportsClient({
  reports,
  totalScans,
  avgScore,
  subscriptionPlan,
}: {
  reports: ReportListItem[]
  totalScans: number
  avgScore: number | null
  subscriptionPlan: string
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')

  const filtered = useMemo(() => {
    let result = reports

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((r) => r.domainUrl.toLowerCase().includes(q))
    }

    const now = new Date()
    if (timeFilter === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      result = result.filter((r) => new Date(r.createdAt) >= start)
    } else if (timeFilter === 'week') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      result = result.filter((r) => new Date(r.createdAt) >= start)
    } else if (timeFilter === 'month') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      result = result.filter((r) => new Date(r.createdAt) >= start)
    }

    return result
  }, [reports, searchQuery, timeFilter])

  const timeOptions: { value: TimeFilter; label: string }[] = [
    { value: 'all', label: 'All time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 days' },
    { value: 'month', label: 'Last 30 days' },
  ]

  const filtersOn = Boolean(searchQuery) || timeFilter !== 'all'

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader signedIn variant="app" />

      <div className="relative container mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <PaperGlow className="opacity-70" />

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-2 inline-flex text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Back to dashboard
            </Link>
            <h1 className="mt-2 font-display text-3xl tracking-tight">All reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {reports.length} scan{reports.length !== 1 ? 's' : ''} · Hobby{' '}
              {HOBBY_MAX_PAGES} / Pro {PRO_MAX_PAGES} page cap
            </p>
          </div>
          <Link href="/dashboard#scan">
            <Button size="sm">New scan</Button>
          </Link>
        </div>

        <AccountWidgets
          totalScans={totalScans}
          avgScore={avgScore}
          subscriptionPlan={subscriptionPlan}
        />

        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Label htmlFor="report-search" className="sr-only">
              Search domains
            </Label>
            <Input
              id="report-search"
              type="text"
              placeholder="Search domains…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
            {timeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTimeFilter(opt.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  timeFilter === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {filtersOn && (
          <p className="mb-4 text-xs text-muted-foreground">
            Showing {filtered.length} of {reports.length} reports
            {searchQuery ? <span> matching &quot;{searchQuery}&quot;</span> : null}
          </p>
        )}

        {filtered.length === 0 ? (
          filtersOn ? (
            <div className="rounded-3xl border border-dashed border-border bg-card py-20 text-center">
              <h3 className="mb-2 font-display text-xl">No matching reports</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or time filter.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('')
                  setTimeFilter('all')
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <ReportsEmpty
              heading="No reports yet"
              body={`Scan a domain from the dashboard. Hobby covers ${HOBBY_MAX_PAGES} pages; Pro covers ${PRO_MAX_PAGES}.`}
              ctaHref="/dashboard#scan"
              ctaLabel="Scan a domain"
            />
          )
        ) : (
          <ReportList reports={filtered} />
        )}
      </div>
    </div>
  )
}
