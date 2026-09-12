import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SEOReport } from '@/lib/scanner'
import { isRunningPayload, parseStoredScan } from '@/lib/scan-job'
import { ReportHero } from './report-hero'
import { ReportActions } from './report-actions'
import { ScanProgress } from './scan-progress'
import { Badge } from '@/components/ui/badge'
import { SiteHeader } from '@/components/site-chrome'

export default async function ReportPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/seo-audit-login')
  }

  const reportRecord = await prisma.domainReport.findUnique({
    where: { id: id },
  })

  if (!reportRecord || reportRecord.userId !== user.id) {
    redirect('/dashboard')
  }

  const stored = parseStoredScan(reportRecord.reportData)

  if (reportRecord.status === 'running' && isRunningPayload(stored)) {
    return (
      <div className="relative min-h-screen bg-background">
        <SiteHeader signedIn variant="app" />
        <div className="container relative z-10 mx-auto max-w-4xl px-4 py-10 sm:px-8">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to dashboard
          </Link>
          <ScanProgress
            reportId={reportRecord.id}
            domainUrl={reportRecord.domainUrl}
            initial={stored}
          />
        </div>
      </div>
    )
  }

  if (reportRecord.status === 'failed' || stored?.status === 'failed') {
    const message =
      stored && stored.status === 'failed' ? stored.error : 'The scan failed.'
    return (
      <div className="relative min-h-screen bg-background">
        <SiteHeader signedIn variant="app" />
        <div className="container relative z-10 mx-auto max-w-4xl px-4 py-10 sm:px-8">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to dashboard
          </Link>
          <div className="rounded-3xl border border-border bg-card p-8">
            <h1 className="font-display text-3xl">Scan failed</h1>
            <p className="mt-3 text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      </div>
    )
  }

  const report = (stored?.status === 'complete'
    ? stored
    : JSON.parse(reportRecord.reportData)) as SEOReport

  const isLegacy = !report.aggregatedChecks

  const sortedChecks = report.aggregatedChecks || []
  const actionPlanItems = report.summary?.topPriorities || sortedChecks.filter((c) => c.status !== 'good')

  const score = report.summary?.score ?? (report as SEOReport & { score?: number }).score ?? 0

  return (
    <div className="relative min-h-screen bg-background">
      <SiteHeader signedIn variant="app" />

      <div className="container relative z-10 mx-auto max-w-4xl px-4 py-10 sm:px-8 print:max-w-none print:px-4 print:py-4">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link
            href="/dashboard"
            className="inline-flex text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to dashboard
          </Link>
          <ReportActions report={report} domainUrl={reportRecord.domainUrl} />
        </div>

        <div className="print:hidden">
          <ReportHero
            score={score}
            domain={new URL(report.domain || reportRecord.domainUrl).hostname}
            scannedAt={reportRecord.createdAt.toISOString()}
            domainUrl={reportRecord.domainUrl}
          />
        </div>

        {isLegacy ? (
          <div className="rounded-3xl border border-border bg-card p-8 text-center">
            <h3 className="text-lg font-medium">Legacy report format</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              This report was generated using an older scanner. Rescan the domain
              for multi-page insights.
            </p>
            <Link href="/dashboard" className="text-sm underline underline-offset-4">
              Run new scan
            </Link>
          </div>
        ) : (
          <div>
            {report.coverage && (
              <p className="mb-8 text-sm text-muted-foreground">
                Methods: first HTML only, no JavaScript render. Crawled{' '}
                {report.coverage.crawled} of {report.coverage.discovered}{' '}
                discovered URLs (cap {report.coverage.cap}
                {report.coverage.stopReason === 'cap'
                  ? ' — stopped at the plan cap, not the whole site'
                  : ''}
                ).
              </p>
            )}

            <div className="mb-12">
              <h2 className="mb-4 font-display text-xl">Site-wide page analysis</h2>
              <div className="overflow-x-auto rounded-3xl border border-border bg-card">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Page</th>
                      <th className="px-6 py-4">Score</th>
                      <th className="px-6 py-4">Issues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {report.pageAnalysis.map((p, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 font-mono font-medium">{p.path}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              p.score >= 80
                                ? 'bg-index/10 text-index'
                                : p.score >= 50
                                  ? 'bg-chart-2/10 text-chart-2'
                                  : 'bg-destructive/10 text-destructive'
                            }`}
                          >
                            {p.score}/100
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {p.issuesCount} issues
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {actionPlanItems.length > 0 && (
              <div className="mb-16">
                <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
                  <h2 className="mb-2 font-display text-2xl">Your action plan</h2>
                  <p className="mb-6 text-sm text-muted-foreground">
                    Prioritized steps to improve your SEO score
                  </p>

                  <div className="space-y-4">
                    {actionPlanItems.map((item, index) => (
                      <div
                        key={'action-' + item.id}
                        className="flex items-start gap-4 rounded-2xl border border-border bg-background p-5"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-base font-medium">{item.label}</h3>
                              {item.status === 'critical' ? (
                                <Badge variant="outline">High</Badge>
                              ) : (
                                <Badge variant="secondary">Medium</Badge>
                              )}
                            </div>
                          </div>

                          <p className="mb-4 text-sm text-muted-foreground">
                            {item.issueText}
                          </p>

                          <div className="border-l border-border py-1 pl-4">
                            <h4 className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                              How to fix
                            </h4>
                            <p className="text-sm leading-relaxed">
                              {item.howToFix}
                              {item.worstPage && (
                                <span className="ml-1 inline-block text-muted-foreground">
                                  (worst: {item.worstPage})
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(() => {
              const aiChecks = (report.aggregatedChecks || []).filter(
                (c) =>
                  c.category === 'ai-search' ||
                  [
                    'ai-snippet-eligible',
                    'ai-bots-robots',
                    'ai-extractable-text',
                    'llms-txt',
                  ].includes(c.id)
              )
              if (aiChecks.length === 0) return null
              return (
                <section className="mb-16 rounded-3xl border border-border bg-card p-6 sm:p-8">
                  <h2 className="mb-2 font-display text-2xl">AI search / GEO</h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    This is still SEO: the page must be indexed and snippet-eligible.
                    There is no GEO score, citation percentage, or &quot;AI Overview
                    ready&quot; badge. Google AI Overviews and AI Mode retrieve from
                    Search. Measure owned impressions in the{' '}
                    <a
                      href="https://support.google.com/webmasters/answer/16984139"
                      className="underline underline-offset-4"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Search Console Generative AI performance report
                    </a>
                    . Do not scrape ChatGPT. Bing Copilot uses bingbot plus Bing
                    noarchive/nocache; Google noarchive is a no-op.
                  </p>
                  <ul className="space-y-3">
                    {aiChecks.map((item) => (
                      <li key={item.id} className="rounded-2xl border border-border p-4">
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <h3 className="font-medium">{item.label}</h3>
                          <Badge variant="secondary" className="capitalize text-xs">
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.issueText}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })()}

            <div className="mb-6">
              <h2 className="font-display text-2xl">Detailed analysis</h2>
            </div>

            <p className="mb-8 text-sm text-muted-foreground">
              A breakdown of every metric evaluated during the crawl.
            </p>

            <div className="space-y-12">
              {report.checksByCategory &&
                Object.entries(report.checksByCategory).map(([category, checks]) => {
                  if (category === 'ai-search') return null
                  if (!checks || checks.length === 0) return null

                  return (
                    <div key={category} className="space-y-4">
                      <h3 className="mb-4 flex items-center justify-between gap-4 border-b border-border pb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {category.replace('-', ' ')}
                      </h3>

                      <div className="grid gap-4">
                        {checks.map((item) => {
                          const statusBadgeColor =
                            item.status === 'critical'
                              ? 'bg-destructive/10 text-destructive'
                              : item.status === 'warning'
                                ? 'bg-chart-2/10 text-chart-2'
                                : 'bg-index/10 text-index'

                          return (
                            <div
                              key={item.id}
                              className="overflow-hidden rounded-3xl border border-border bg-card"
                            >
                              <div className="relative flex items-center p-5">
                                {item.status !== 'good' && (
                                  <div
                                    className={`absolute top-0 bottom-0 left-0 w-1 ${
                                      item.status === 'critical' ? 'bg-destructive' : 'bg-chart-2'
                                    }`}
                                  />
                                )}

                                <h3 className="flex-1 text-base font-medium">{item.label}</h3>

                                <Badge
                                  variant="secondary"
                                  className={`text-xs uppercase tracking-[0.12em] ${statusBadgeColor}`}
                                >
                                  {item.status}
                                </Badge>
                              </div>

                              <div className="mt-0 space-y-6 border-t border-border p-5">
                                <div>
                                  <h4 className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                    Current value
                                  </h4>
                                  <div className="rounded-2xl border border-border bg-muted/40 px-3 py-2.5 font-mono text-sm break-all">
                                    {item.currentValue}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                    Issue
                                  </h4>
                                  <p className="text-sm font-medium">{item.issueText}</p>
                                </div>

                                <div>
                                  <h4 className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                    Why it matters
                                  </h4>
                                  <p className="text-sm leading-relaxed text-muted-foreground">
                                    {item.whyItMatters}
                                  </p>
                                </div>

                                {item.status !== 'good' && (
                                  <div>
                                    <h4 className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                                      How to fix
                                    </h4>
                                    <p className="mb-3 text-sm leading-relaxed">
                                      {item.howToFix}
                                      {item.worstPage && (
                                        <span className="ml-1 inline-block text-muted-foreground">
                                          (worst: {item.worstPage})
                                        </span>
                                      )}
                                    </p>

                                    {item.snippet && (
                                      <pre className="overflow-x-auto rounded-2xl border border-border bg-muted p-4 text-xs text-foreground">
                                        <code>{item.snippet}</code>
                                      </pre>
                                    )}
                                  </div>
                                )}

                                {item.status === 'good' && item.snippet && (
                                  <pre className="overflow-x-auto rounded-2xl border border-border bg-muted p-4 text-xs text-foreground">
                                    <code>{item.snippet}</code>
                                  </pre>
                                )}

                                {item.reference && (
                                  <div className="pt-2">
                                    <a
                                      href={item.reference}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex text-xs underline underline-offset-4"
                                    >
                                      Read official documentation
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

              {!report.checksByCategory && (
                <div className="grid gap-4">
                  <p className="text-sm text-muted-foreground italic">
                    Categorized mapping not available for this legacy report.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
