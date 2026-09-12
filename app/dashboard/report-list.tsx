'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  coverageLabel,
  formatReportDate,
  gradeTone,
  hostnameFromUrl,
  type ReportListItem,
} from './report-list-data'

export function RetryScanForm({ domainUrl }: { domainUrl: string }) {
  const [pending, setPending] = useState(false)

  return (
    <form
      action="/api/scan"
      method="POST"
      onSubmit={() => setPending(true)}
    >
      <input type="hidden" name="url" value={domainUrl} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? 'Retrying…' : 'Retry'}
      </Button>
    </form>
  )
}

export function ReportsEmpty({
  heading,
  body,
  ctaHref,
  ctaLabel,
}: {
  heading: string
  body: string
  ctaHref: string
  ctaLabel: string
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center sm:py-20">
      <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        Reports
      </p>
      <h3 className="font-display text-2xl tracking-tight">{heading}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        {body}
      </p>
      <Link href={ctaHref} className="mt-6 inline-flex">
        <Button>{ctaLabel}</Button>
      </Link>
    </div>
  )
}

function StatusMark({ report }: { report: ReportListItem }) {
  if (report.status === 'running') {
    return (
      <span className="inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        Scanning
      </span>
    )
  }

  if (report.status === 'failed') {
    return (
      <span className="inline-flex rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-destructive">
        Failed
      </span>
    )
  }

  if (!report.grade) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  return (
    <span
      className="font-display text-2xl leading-none"
      style={{ color: gradeTone(report.grade) }}
    >
      {report.grade}
    </span>
  )
}

function CoverageCell({ report }: { report: ReportListItem }) {
  if (report.status === 'running') {
    const pct =
      report.crawled != null && report.cap && report.cap > 0
        ? Math.min(100, Math.round((report.crawled / report.cap) * 100))
        : 0
    const label =
      report.crawled != null && report.cap != null
        ? `${report.crawled}/${report.cap}`
        : 'Starting…'

    return (
      <div className="min-w-[7.5rem]">
        <p className="text-sm tabular-nums text-foreground">{label}</p>
        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
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
    )
  }

  if (report.status === 'failed') {
    return (
      <p className="max-w-[16rem] text-sm text-muted-foreground">
        {report.error || 'The scan failed.'}
      </p>
    )
  }

  return (
    <p className="text-sm tabular-nums text-foreground">
      {coverageLabel(report.crawled, report.cap)}
    </p>
  )
}

function ReportCard({ report }: { report: ReportListItem }) {
  const host = hostnameFromUrl(report.domainUrl)

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card">
      <Link
        href={`/dashboard/report/${report.id}`}
        className="flex items-start gap-4 p-5 transition-colors hover:bg-muted/40"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{host}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatReportDate(report.createdAt)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <StatusMark report={report} />
          <div className="mt-2">
            <CoverageCell report={report} />
          </div>
        </div>
      </Link>
      {report.status === 'failed' && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">Run this domain again</p>
          <RetryScanForm domainUrl={report.domainUrl} />
        </div>
      )}
    </article>
  )
}

export function ReportList({ reports }: { reports: ReportListItem[] }) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {reports.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-3xl border border-border bg-card md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              <th className="px-6 py-3.5 font-medium">Domain</th>
              <th className="px-6 py-3.5 font-medium">Date</th>
              <th className="px-6 py-3.5 font-medium">Grade</th>
              <th className="px-6 py-3.5 font-medium">Coverage</th>
              <th className="px-6 py-3.5 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reports.map((report) => {
              const host = hostnameFromUrl(report.domainUrl)
              return (
                <tr key={report.id} className="align-middle hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/report/${report.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {host}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {formatReportDate(report.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusMark report={report} />
                  </td>
                  <td className="px-6 py-4">
                    <CoverageCell report={report} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {report.status === 'failed' ? (
                      <RetryScanForm domainUrl={report.domainUrl} />
                    ) : (
                      <Link
                        href={`/dashboard/report/${report.id}`}
                        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                      >
                        Open
                      </Link>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
