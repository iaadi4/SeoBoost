'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/site-chrome'
import { PaperGlow } from '@/components/seo-art'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Report {
  id: string
  domainUrl: string
  score: number
  createdAt: string
}

type TimeFilter = 'all' | 'today' | 'week' | 'month'

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#3d6b4f' : score >= 50 ? '#c47a4a' : '#b42318'
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const dash = (score / 100) * circumference

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="#e6e1d8" strokeWidth="3" />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-medium" style={{ color }}>
        {score}
      </span>
    </div>
  )
}

export function ReportsClient({
  reports,
  totalScans,
  avgScore,
  subscriptionPlan,
}: {
  reports: Report[]
  totalScans: number
  avgScore: number
  subscriptionPlan: string
}) {
  const isPro = subscriptionPlan === 'pro'
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

  const stats = [
    {
      label: 'Total scans',
      value: totalScans,
      suffix: '',
      description: 'reports generated',
    },
    {
      label: 'Avg. score',
      value: avgScore,
      suffix: '/100',
      description: 'domain health avg',
    },
    {
      label: 'Plan',
      value: isPro ? 'Pro' : 'Free',
      suffix: '',
      description: isPro ? 'unlimited access' : 'standard features',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader signedIn variant="app" />

      <div className="relative container mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <PaperGlow className="opacity-70" />

        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-2 inline-flex text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to dashboard
          </Link>
          <h1 className="mt-2 font-display text-3xl tracking-tight">All reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {reports.length} total domain{reports.length !== 1 ? 's' : ''} scanned
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-border bg-card p-5"
            >
              <p className="mb-0.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {stat.label}
              </p>
              <p className="text-2xl font-medium leading-none">
                {stat.value}
                {stat.suffix && (
                  <span className="ml-0.5 text-sm font-normal text-muted-foreground">
                    {stat.suffix}
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
            </div>
          ))}
        </div>

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

        {(searchQuery || timeFilter !== 'all') && (
          <p className="mb-4 text-xs text-muted-foreground">
            Showing {filtered.length} of {reports.length} reports
            {searchQuery && <span> matching &quot;{searchQuery}&quot;</span>}
          </p>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card py-24 text-center">
            <h3 className="mb-2 font-display text-xl">
              {searchQuery || timeFilter !== 'all'
                ? 'No matching reports'
                : 'No reports yet'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || timeFilter !== 'all'
                ? 'Try adjusting your search or time filter.'
                : 'Run your first scan from the dashboard.'}
            </p>
            {(searchQuery || timeFilter !== 'all') && (
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
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((report) => {
              let hostname = report.domainUrl
              try {
                hostname = new URL(report.domainUrl).hostname
              } catch {}
              const date = new Date(report.createdAt)
              const dateStr = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
              const timeStr = date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })

              return (
                <Link key={report.id} href={`/dashboard/report/${report.id}`}>
                  <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 transition-colors hover:bg-muted/40">
                    <ScoreRing score={report.score} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{hostname}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {dateStr} · {timeStr}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
