'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RunningScanPayload } from '@/lib/scan-job'
import { hostnameFromUrl, planCapLabel } from './report-display'

type Progress = RunningScanPayload['progress']

export function ScanProgress({
  reportId,
  domainUrl,
  initial,
  disablePoll = false,
}: {
  reportId: string
  domainUrl: string
  initial: { progress: Progress }
  disablePoll?: boolean
}) {
  const router = useRouter()
  const [progress, setProgress] = useState(initial.progress)
  const [error, setError] = useState<string | null>(null)
  const host = hostnameFromUrl(domainUrl)

  useEffect(() => {
    if (disablePoll) return
    let cancelled = false

    async function poll() {
      try {
        await fetch('/api/scan/tick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: reportId }),
        })
        const res = await fetch(`/api/report/${reportId}`)
        if (!res.ok) throw new Error('Could not load scan progress')
        const data = await res.json()
        const report = data.report as {
          status?: string
          progress?: RunningScanPayload['progress']
          error?: string
        }
        if (cancelled) return
        if (report.status === 'complete') {
          router.refresh()
          return
        }
        if (report.status === 'failed') {
          setError(report.error || 'Scan failed')
          return
        }
        if (report.progress) setProgress(report.progress)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Scan progress failed')
        }
      }
    }

    const id = setInterval(poll, 2000)
    void poll()
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [disablePoll, reportId, router])

  const pct =
    progress.cap > 0 ? Math.min(100, Math.round((progress.crawled / progress.cap) * 100)) : 0

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-block rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Scanning…
          </span>
          <span className="inline-block rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Grade pending
          </span>
        </div>
        <h1 className="font-display text-3xl tracking-tight break-all sm:text-4xl">{host}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Fetching first HTML only — Cheerio parse, no JavaScript render, no field
          Core Web Vitals. The A–F grade and score appear when the crawl finishes.
          A running scan is not a 0 score.
        </p>

        <dl className="mt-6 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border border-border bg-background px-2 py-3">
            <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Crawled
            </dt>
            <dd className="mt-1 font-display text-2xl tabular-nums">{progress.crawled}</dd>
          </div>
          <div className="rounded-2xl border border-border bg-background px-2 py-3">
            <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Discovered
            </dt>
            <dd className="mt-1 font-display text-2xl tabular-nums">{progress.discovered}</dd>
          </div>
          <div className="rounded-2xl border border-border bg-background px-2 py-3">
            <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Cap
            </dt>
            <dd className="mt-1 font-display text-2xl tabular-nums">{progress.cap}</dd>
          </div>
        </dl>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {progress.crawled} of {progress.cap} page cap · {planCapLabel(progress.cap)}
            </span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label="Scan progress toward page cap"
          >
            <div
              className="h-full bg-index transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
      {error && (
        <p role="alert" className="field-error border-t border-border px-6 py-4 sm:px-8">
          {error}
        </p>
      )}
    </div>
  )
}
