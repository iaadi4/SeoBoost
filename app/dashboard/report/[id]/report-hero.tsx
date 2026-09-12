import type { CrawlCoverage, ScanSummary } from '@/lib/scanner'
import {
  coverageHeadline,
  formatDuration,
  formatScannedAt,
  gradeTone,
  planCapLabel,
  statusCounts,
  stopReasonLabel,
} from './report-display'
import type { AggregatedCheck } from '@/lib/scanner'

interface ReportHeroProps {
  domain: string
  domainUrl: string
  scannedAt: string
  score: number
  grade?: ScanSummary['grade']
  coverage?: CrawlCoverage
  durationMs?: number
  checks: AggregatedCheck[]
  pagesScanned?: number
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 62
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference

  return (
    <div className="relative flex h-32 w-32 items-center justify-center sm:h-40 sm:w-40">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="80" cy="80" r={r} fill="none" stroke="#e6e1d8" strokeWidth="9" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-3xl tabular-nums sm:text-4xl" style={{ color }}>
          {score}
        </span>
        <span className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          / 100
        </span>
      </div>
    </div>
  )
}

export function ReportHero({
  domain,
  domainUrl,
  scannedAt,
  score,
  grade,
  coverage,
  durationMs,
  checks,
  pagesScanned,
}: ReportHeroProps) {
  const counts = statusCounts(checks)
  const tone = grade ? gradeTone(grade) : score >= 75 ? '#3d6b4f' : score >= 45 ? '#c47a4a' : '#b42318'
  const duration = formatDuration(durationMs)

  return (
    <header className="mb-8 overflow-hidden rounded-3xl border border-border bg-card">
      <div className="flex flex-col gap-6 p-5 sm:gap-8 sm:p-8 md:flex-row md:items-center">
        <div className="flex items-center justify-center gap-5 md:shrink-0 md:self-auto">
          <ScoreRing score={score} color={tone} />
          {grade && (
            <div className="text-center md:hidden">
              <div className="font-display text-6xl leading-none" style={{ color: tone }}>
                {grade}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                A–F grade
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 text-center md:text-left">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <span className="inline-block rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              SEO audit
            </span>
            {grade && (
              <span
                className="inline-flex items-center rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.14em]"
                style={{ color: tone }}
              >
                Grade {grade}
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl tracking-tight break-all sm:text-4xl">{domain}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Scanned {formatScannedAt(scannedAt)}
            {duration ? ` · ${duration}` : ''}
          </p>
          <a
            href={domainUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-sm underline underline-offset-4"
          >
            Visit live site
          </a>
        </div>

        {grade && (
          <div className="hidden shrink-0 text-center md:block">
            <div className="font-display text-7xl leading-none" style={{ color: tone }}>
              {grade}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              A–F grade
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 border-t border-border">
        {[
          { label: 'Fail', value: counts.critical, className: 'text-destructive' },
          { label: 'Warn', value: counts.warning, className: 'text-chart-2' },
          { label: 'Pass', value: counts.good, className: 'text-index' },
        ].map((item) => (
          <div
            key={item.label}
            className="border-border px-2 py-3 text-center not-last:border-r sm:px-6 sm:py-4"
          >
            <div className={`font-display text-xl tabular-nums sm:text-3xl ${item.className}`}>
              {item.value}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {coverage ? (
        <>
          <dl className="grid grid-cols-3 border-t border-border">
            {[
              { label: 'Crawled', value: coverage.crawled },
              { label: 'Discovered', value: coverage.discovered },
              { label: 'Cap', value: coverage.cap },
            ].map((item) => (
              <div
                key={item.label}
                className="border-border px-2 py-3 text-center not-last:border-r sm:px-6 sm:py-4"
              >
                <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="mt-1 font-display text-xl tabular-nums sm:text-2xl">{item.value}</dd>
              </div>
            ))}
          </dl>
          <div className="border-t border-border bg-muted/30 px-4 py-3 text-sm sm:px-8 sm:py-4">
            <p className="font-medium">{coverageHeadline(coverage)}</p>
            <p className="mt-1 text-muted-foreground">
              {stopReasonLabel(coverage.stopReason)}
              {pagesScanned != null && pagesScanned !== coverage.crawled
                ? ` · ${pagesScanned} pages scored`
                : ''}
              {' · '}
              {planCapLabel(coverage.cap)}
            </p>
          </div>
        </>
      ) : (
        <div className="border-t border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground sm:px-8">
          Coverage (crawled / discovered / cap / stop reason) was not stored on
          this report
          {pagesScanned != null ? ` · ${pagesScanned} pages scored` : ''}.
        </div>
      )}
    </header>
  )
}
