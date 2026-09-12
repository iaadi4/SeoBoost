'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RunningScanPayload } from '@/lib/scan-job'

export function ScanProgress({
  reportId,
  domainUrl,
  initial,
}: {
  reportId: string
  domainUrl: string
  initial: RunningScanPayload
}) {
  const router = useRouter()
  const [progress, setProgress] = useState(initial.progress)
  const [error, setError] = useState<string | null>(null)
  const host = (() => {
    try {
      return new URL(domainUrl).hostname
    } catch {
      return domainUrl
    }
  })()

  useEffect(() => {
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
        const report = data.report as { status?: string; progress?: RunningScanPayload['progress']; error?: string }
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
  }, [reportId, router])

  const pct =
    progress.cap > 0 ? Math.min(100, Math.round((progress.crawled / progress.cap) * 100)) : 0

  return (
    <div className="rounded-3xl border border-border bg-card p-8">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        Crawling
      </p>
      <h1 className="mt-3 font-display text-3xl">{host}</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Crawled {progress.crawled} of {progress.discovered} discovered URLs
        (cap {progress.cap}). First HTML only — not a full-site census if we
        hit the cap.
      </p>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-index" style={{ width: `${pct}%` }} />
      </div>
      {error && (
        <p role="alert" className="field-error mt-4">
          {error}
        </p>
      )}
    </div>
  )
}
