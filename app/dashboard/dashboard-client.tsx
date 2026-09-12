'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-chrome'
import { PaperGlow } from '@/components/seo-art'

const FREE_SCAN_LIMIT = 3

interface Report {
  id: string
  domainUrl: string
  score: number
  createdAt: string
}

interface Props {
  userName: string
  subscriptionPlan: string
  totalScans: number
  avgScore: number
  recentReports: Report[]
  children: React.ReactNode
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#3d6b4f' : score >= 50 ? '#c47a4a' : '#b42318'
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const dash = (score / 100) * circumference

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="#e6e1d8"
          strokeWidth="3"
        />
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

export function DashboardClient({
  userName,
  subscriptionPlan,
  totalScans,
  avgScore,
  recentReports,
  children,
}: Props) {
  const isPro = subscriptionPlan === 'pro'
  const scansRemaining = isPro
    ? Infinity
    : Math.max(0, FREE_SCAN_LIMIT - totalScans)
  const limitReached = !isPro && totalScans >= FREE_SCAN_LIMIT

  const stats = [
    {
      label: 'Total scans',
      value: totalScans,
      suffix: '',
      description: 'domains analyzed',
    },
    {
      label: 'Avg. score',
      value: avgScore,
      suffix: '/100',
      description: 'across all reports',
    },
    {
      label: 'Plan',
      value: isPro ? 'Pro' : 'Free',
      suffix: '',
      description: isPro
        ? 'unlimited scans'
        : `${scansRemaining} scan${scansRemaining === 1 ? '' : 's'} remaining`,
      highlight: isPro,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader signedIn variant="app" />

      <div className="relative container mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <PaperGlow className="opacity-70" />

        <div className="mb-8">
          <p className="mb-1 text-sm text-muted-foreground">Welcome back</p>
          <h1 className="font-display text-3xl tracking-tight">Hey, {userName}</h1>
        </div>

        {limitReached && (
          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-border bg-card p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                You&apos;ve used all 3 free scans
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Subscribe for $9/mo and get unlimited scans.
              </p>
            </div>
            <Link href="/pricing">
              <Button size="sm">Upgrade — $9</Button>
            </Link>
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5"
            >
              <div>
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
            </div>
          ))}
        </div>

        <div className="mb-10 overflow-hidden rounded-3xl border border-border bg-card">
          <div className="p-8">
            <div className="mb-1 flex items-start justify-between">
              <h2 className="font-display text-2xl">New domain scan</h2>
              {!isPro && (
                <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                  {scansRemaining}/{FREE_SCAN_LIMIT} free scans left
                </span>
              )}
            </div>
            <p className="mb-6 max-w-lg text-sm text-muted-foreground">
              Enter any domain for a technical SEO health report.
            </p>
            {limitReached ? (
              <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Free scan limit reached.{' '}
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
            <p className="mt-0.5 text-xs text-muted-foreground">3 most recent scans</p>
          </div>
          <Link href="/dashboard/reports">
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card py-24 text-center">
            <h3 className="mb-2 font-display text-xl">No reports yet</h3>
            <p className="text-sm text-muted-foreground">
              Run your first scan using the input above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentReports.map((report) => {
              let hostname = report.domainUrl
              try {
                hostname = new URL(report.domainUrl).hostname
              } catch {}
              const date = new Date(report.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
              return (
                <Link key={report.id} href={`/dashboard/report/${report.id}`}>
                  <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 transition-colors hover:bg-muted/40">
                    <ScoreRing score={report.score} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{hostname}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{date}</p>
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
