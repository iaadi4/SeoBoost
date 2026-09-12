import Link from 'next/link'
import { hostnameFromUrl } from './report-display'
import { ReportFrame } from './report-frame'

export function ReportFailed({
  domainUrl,
  message,
}: {
  domainUrl: string
  message: string
}) {
  const host = hostnameFromUrl(domainUrl)
  return (
    <ReportFrame>
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <p className="mb-3 inline-block rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Scan failed
        </p>
        <h1 className="font-display text-3xl tracking-tight break-all">{host}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{message}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          There is no A–F grade for a failed crawl. We fetch the first HTML
          response with Cheerio — timeouts, blocks, or a JavaScript-only shell
          can stop the scan. This is not a 0 score.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex text-sm underline underline-offset-4"
        >
          Run a new scan
        </Link>
      </div>
    </ReportFrame>
  )
}

export function ReportUnreadable() {
  return (
    <ReportFrame>
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <h1 className="font-display text-3xl">Could not read this report</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The stored scan data is not valid JSON. Run a new scan from the
          dashboard.
        </p>
        <Link href="/dashboard" className="mt-6 inline-flex text-sm underline underline-offset-4">
          Back to dashboard
        </Link>
      </div>
    </ReportFrame>
  )
}

export function ReportLegacy() {
  return (
    <ReportFrame>
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 text-center">
        <h1 className="font-display text-3xl">Legacy report format</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This report was generated with an older scanner. Rescan the domain
          for multi-page checks, evidence, and the A–F grade.
        </p>
        <Link href="/dashboard" className="mt-6 inline-flex text-sm underline underline-offset-4">
          Run new scan
        </Link>
      </div>
    </ReportFrame>
  )
}
