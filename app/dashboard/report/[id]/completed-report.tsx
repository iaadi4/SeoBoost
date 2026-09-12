import Link from 'next/link'
import type { PageAnalysis, SEOReport } from '@/lib/scanner'
import type { ReactNode } from 'react'
import { SCANNER_CATEGORY_COUNT, SCANNER_CHECK_COUNT } from '@/lib/claims'
import { Badge } from '@/components/ui/badge'
import { ReportActions } from './report-actions'
import { ReportFindings } from './report-findings'
import { ReportFrame } from './report-frame'
import { ReportHero } from './report-hero'
import { groupChecks, hostnameFromUrl, statusLabel } from './report-display'

function pageScoreClass(score: number) {
  if (score >= 80) return 'bg-index/10 text-index'
  if (score >= 50) return 'bg-chart-2/10 text-chart-2'
  return 'bg-destructive/10 text-destructive'
}

function PageList({ pages }: { pages: PageAnalysis[] }) {
  if (pages.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-6 sm:p-8">
        <h2 className="font-display text-xl">No pages scored</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The crawler did not fetch HTML pages for this domain. Domain-level
          files (robots.txt, sitemap, llms.txt) may still appear below.
        </p>
      </div>
    )
  }

  return (
    <section>
      <h2 className="mb-1 font-display text-xl">Pages crawled</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Per-page score from the checks on that first HTML document.
      </p>
      <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
        {pages.map((page) => (
          <li key={page.url || page.path} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-6">
            <a
              href={page.url}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 font-mono text-sm break-all underline-offset-4 hover:underline"
            >
              {page.path}
            </a>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${pageScoreClass(page.score)}`}
            >
              {page.score}/100
            </span>
            <span className="text-xs text-muted-foreground">
              {page.issuesCount} {page.issuesCount === 1 ? 'issue' : 'issues'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function MethodsFootnote() {
  return (
    <footer className="mt-12 border-t border-border pt-6 text-sm leading-relaxed text-muted-foreground">
      <h2 className="mb-2 text-xs uppercase tracking-[0.16em]">Methods and limits</h2>
      <p>
        First HTML response parsed with Cheerio. No JavaScript render, so
        client-rendered shells look empty. No field Core Web Vitals — we do not
        wire CrUX or PageSpeed Insights, so there are no LCP, INP, or CLS
        numbers. AI search items are eligibility heuristics, not a GEO score.
        Missing llms.txt is not a fail. Hobby crawls up to 50 pages; Pro up to
        500. Up to {SCANNER_CHECK_COUNT} unique checks in{' '}
        {SCANNER_CATEGORY_COUNT} categories. Measure owned AI Overview / AI Mode
        impressions in the{' '}
        <a
          href="https://support.google.com/webmasters/answer/16984139"
          className="underline underline-offset-4"
          target="_blank"
          rel="noopener noreferrer"
        >
          Search Console Generative AI performance report
        </a>
        .
      </p>
    </footer>
  )
}

export function CompletedReport({
  report,
  domainUrl,
  scannedAt,
  banner,
}: {
  report: SEOReport
  domainUrl: string
  scannedAt: string
  banner?: ReactNode
}) {
  const domain = hostnameFromUrl(report.domain || domainUrl)
  const score = report.summary?.score ?? 0
  const grade = report.summary?.grade
  const checks = report.aggregatedChecks || []
  const actionPlan = report.summary?.topPriorities?.slice(0, 5) ?? []
  const pages = report.pageAnalysis || []
  const grouped = groupChecks(report.checksByCategory, checks)

  return (
    <ReportFrame actions={<ReportActions report={report} domainUrl={domainUrl} />}>
      {banner}
      <ReportHero
        score={score}
        grade={grade}
        domain={domain}
        scannedAt={scannedAt}
        domainUrl={domainUrl}
        coverage={report.coverage}
        durationMs={report.durationMs}
        checks={checks}
        pagesScanned={report.pagesScanned}
      />

      <div className="mb-10">
        <PageList pages={pages} />
      </div>

      {actionPlan.length > 0 && (
        <section className="mb-10 rounded-3xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-display text-2xl">Fix these first</h2>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">
            Highest-severity checks from this crawl — not a ranked market claim.
          </p>
          <ol className="space-y-3">
            {actionPlan.map((item, index) => (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4 sm:gap-4 sm:p-5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-medium">{item.label}</h3>
                    <Badge
                      variant="secondary"
                      className={
                        item.status === 'critical'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-chart-2/10 text-chart-2'
                      }
                    >
                      {statusLabel(item.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.issueText}</p>
                  <p className="mt-3 text-sm leading-relaxed">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      How to fix
                    </span>
                    <span className="mt-1 block">{item.howToFix}</span>
                  </p>
                  {item.worstPage && (
                    <p className="mt-2 font-mono text-xs text-muted-foreground">
                      Worst page: {item.worstPage}
                    </p>
                  )}
                  <a
                    href={`#check-${item.id}`}
                    className="mt-2 inline-flex text-xs underline underline-offset-4 print:hidden"
                  >
                    Jump to evidence
                  </a>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="mb-10">
        <h2 className="font-display text-2xl">All checks</h2>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Filter by status. Fail and warn rows start open so evidence and the
          fix stay visible.
        </p>
        {checks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <h3 className="font-display text-xl">No checks in this report</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Nothing was stored for this scan. Run a new scan from the
              dashboard.
            </p>
            <Link href="/dashboard" className="mt-4 inline-flex text-sm underline underline-offset-4">
              Back to dashboard
            </Link>
          </div>
        ) : (
          <ReportFindings checksByCategory={grouped} />
        )}
      </div>

      <MethodsFootnote />
    </ReportFrame>
  )
}
