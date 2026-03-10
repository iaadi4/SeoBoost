'use client'

import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Search,
  ArrowUpRight,
  Zap,
  ArrowLeft,
  Calendar,
  Filter,
} from 'lucide-react'

interface Report {
  id: string
  domainUrl: string
  score: number
  createdAt: string
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
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

type TimeFilter = 'all' | 'today' | 'week' | 'month'

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

export function ReportsClient({ reports }: { reports: Report[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')

  const filtered = useMemo(() => {
    let result = reports

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((r) => r.domainUrl.toLowerCase().includes(q))
    }

    // Time filter
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
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
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
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground text-sm gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-8 py-10 max-w-6xl relative">
        {/* Background orbs for "living" feel */}
        <Orb
          className="w-[500px] h-[500px] bg-primary/8 -top-10 -right-40"
          delay={1}
          duration={12}
        />
        <Orb
          className="w-[450px] h-[450px] bg-primary/6 bottom-20 -left-60"
          delay={4}
          duration={15}
        />

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-primary transition-colors mb-2 inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">
            All Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {reports.length} total domain{reports.length !== 1 ? 's' : ''}{' '}
            scanned
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search domains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Time filter */}
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl p-1">
            {timeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimeFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  timeFilter === opt.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {(searchQuery || timeFilter !== 'all') && (
          <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Showing {filtered.length} of {reports.length} reports
            {searchQuery && <span> matching &quot;{searchQuery}&quot;</span>}
          </p>
        )}

        {/* Reports Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border/60 rounded-2xl bg-muted/20">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Search className="h-6 w-6 text-primary/60" />
            </div>
            <h3 className="text-base font-semibold mb-2">
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
                className="mt-4 text-primary"
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
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={container}
            initial="hidden"
            animate="show"
          >
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
                <motion.div key={report.id} variants={item}>
                  <Link href={`/dashboard/report/${report.id}`}>
                    <div className="group rounded-xl border border-border/60 bg-card p-5 flex items-center gap-4 hover:border-primary/40 hover:bg-card/80 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 cursor-pointer">
                      <ScoreRing score={report.score} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors duration-200">
                          {hostname}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {dateStr} · {timeStr}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
