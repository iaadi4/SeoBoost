'use client'

import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Search,
  TrendingUp,
  Globe,
  ArrowUpRight,
  Zap,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'

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

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
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
        opacity: [0.4, 0.7, 0.4],
      }}
      transition={{ duration, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  )
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#3ecf8e' : score >= 50 ? '#f59e0b' : '#ef4444'
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const dash = (score / 100) * circumference

  return (
    <div className="relative flex items-center justify-center h-12 w-12 shrink-0">
      <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
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
      <span className="absolute text-xs font-bold" style={{ color }}>
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
      label: 'Total Scans',
      value: totalScans,
      icon: Globe,
      suffix: '',
      description: 'domains analyzed',
    },
    {
      label: 'Avg. Score',
      value: avgScore,
      icon: TrendingUp,
      suffix: '/100',
      description: 'across all reports',
    },
    {
      label: 'Plan',
      value: isPro ? 'Pro' : 'Free',
      icon: Zap,
      suffix: '',
      description: isPro
        ? 'unlimited scans'
        : `${scansRemaining} scan${scansRemaining === 1 ? '' : 's'} remaining`,
      highlight: isPro,
    },
  ]

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Top nav */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-8 max-w-6xl h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shadow-md shadow-primary/30">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base tracking-tight">
              SEO Boost
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isPro ? (
              <Badge className="bg-primary/15 text-primary border border-primary/30 uppercase text-xs font-bold tracking-wider px-3">
                <Sparkles className="h-3 w-3 mr-1" /> Pro
              </Badge>
            ) : (
              <>
                <Badge
                  variant="secondary"
                  className="bg-muted text-muted-foreground border border-border uppercase text-xs font-semibold tracking-wider px-3"
                >
                  Free
                </Badge>
                <Link href="/pricing">
                  <Button
                    size="sm"
                    className="h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all"
                  >
                    Upgrade — $9
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <motion.div
        className="container mx-auto px-4 sm:px-8 py-10 max-w-6xl relative"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Background orbs for "living" feel */}
        <Orb
          className="w-[600px] h-[600px] bg-primary/10 -top-20 -left-40"
          duration={10}
        />
        <Orb
          className="w-[500px] h-[500px] bg-primary/8 top-80 -right-20"
          delay={3}
          duration={14}
        />

        {/* Header */}
        <motion.div variants={item} className="mb-8">
          <p className="text-sm text-muted-foreground mb-1">Welcome back</p>
          <h1 className="text-3xl font-bold tracking-tight">
            Hey, {userName} 👋
          </h1>
        </motion.div>

        {/* Limit warning banner */}
        {limitReached && (
          <motion.div variants={item} className="mb-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center gap-4">
              <div className="h-9 w-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  You've used all 3 free scans
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pay once for $9 and get unlimited scans forever.
                </p>
              </div>
              <Link href="/pricing">
                <Button
                  size="sm"
                  className="h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shrink-0"
                >
                  Upgrade —&nbsp;<span className="font-bold">$9</span>
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          variants={item}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl border p-5 flex items-center gap-4 hover:border-primary/30 transition-colors duration-200 bg-card ${stat.highlight ? 'border-primary/40 shadow-md shadow-primary/5' : 'border-border/60'}`}
            >
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${stat.highlight ? 'bg-primary/15' : 'bg-primary/10'}`}
              >
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold leading-none">
                  {stat.value}
                  {stat.suffix && (
                    <span className="text-sm text-muted-foreground font-normal ml-0.5">
                      {stat.suffix}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Scan Card */}
        <motion.div variants={item} className="mb-10">
          <div className="rounded-2xl border border-primary/25 bg-card shadow-xl shadow-primary/5 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
            <div className="p-8">
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-xl font-semibold">New Domain Scan</h2>
                {!isPro && (
                  <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/60">
                    {scansRemaining}/{FREE_SCAN_LIMIT} free scans left
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-6 max-w-lg">
                Enter any domain to instantly get a full SEO health report with
                actionable insights.
              </p>
              {limitReached ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/60 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  Free scan limit reached.{' '}
                  <Link
                    href="/pricing"
                    className="text-primary hover:underline font-medium"
                  >
                    Upgrade for $9
                  </Link>{' '}
                  to scan unlimited domains.
                </div>
              ) : (
                children
              )}
            </div>
          </div>
        </motion.div>

        {/* Recent Reports */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold">Recent Reports</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                3 most recent scans
              </p>
            </div>
            <Link href="/dashboard/reports">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary hover:text-primary gap-1 h-8 px-3"
              >
                View All <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {recentReports.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-border/60 rounded-2xl bg-muted/20">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-primary/60" />
              </div>
              <h3 className="text-base font-semibold mb-2">No reports yet</h3>
              <p className="text-sm text-muted-foreground">
                Run your first scan using the input above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentReports.map((report, idx) => {
                let hostname = report.domainUrl
                try {
                  hostname = new URL(report.domainUrl).hostname
                } catch {}
                const date = new Date(report.createdAt).toLocaleDateString(
                  'en-US',
                  { month: 'short', day: 'numeric', year: 'numeric' }
                )
                return (
                  <motion.div
                    key={report.id}
                    variants={item}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <Link href={`/dashboard/report/${report.id}`}>
                      <div className="group rounded-xl border border-border/60 bg-card p-5 flex items-center gap-4 hover:border-primary/40 hover:bg-card/80 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 cursor-pointer">
                        <ScoreRing score={report.score} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors duration-200">
                            {hostname}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {date}
                          </p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
