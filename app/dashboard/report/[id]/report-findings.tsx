'use client'

import { useMemo, useState } from 'react'
import type { AggregatedCheck, CheckStatus } from '@/lib/scanner'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  AGGREGATED_KNOWN_KEYS,
  PAGE_BREAKDOWN_KNOWN_KEYS,
  type StatusFilter,
  categoryInfo,
  extraFindingEntries,
  orderedCategories,
  statusCounts,
  statusLabel,
} from './report-display'

function statusBadgeClass(status: CheckStatus) {
  if (status === 'critical') return 'bg-destructive/10 text-destructive'
  if (status === 'warning') return 'bg-chart-2/10 text-chart-2'
  return 'bg-index/10 text-index'
}

function ExtraFields({
  item,
  knownKeys,
}: {
  item: Record<string, unknown>
  knownKeys: Set<string>
}) {
  const extras = extraFindingEntries(item, knownKeys)
  if (extras.length === 0) return null
  return (
    <div className="space-y-4">
      {extras.map((extra) => (
        <section key={extra.key}>
          <h5 className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {extra.label}
          </h5>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {extra.value}
          </p>
        </section>
      ))}
    </div>
  )
}

function FindingRow({ item, defaultOpen }: { item: AggregatedCheck; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const issuePages = item.pageBreakdown?.filter((p) => p.status !== 'good') ?? []
  const extraPages = Math.max(0, issuePages.length - 8)
  const loose = item as AggregatedCheck & Record<string, unknown>

  return (
    <article
      id={`check-${item.id}`}
      className="overflow-hidden rounded-3xl border border-border bg-card"
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex w-full items-start gap-3 p-4 text-left sm:p-5"
      >
        {item.status !== 'good' && (
          <span
            aria-hidden
            className={cn(
              'absolute top-0 bottom-0 left-0 w-1',
              item.status === 'critical' ? 'bg-destructive' : 'bg-chart-2'
            )}
          />
        )}
        <div className="min-w-0 flex-1 pl-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-medium">{item.label}</h4>
            <Badge
              variant="secondary"
              className={cn('text-[10px] uppercase tracking-[0.12em]', statusBadgeClass(item.status))}
            >
              {statusLabel(item.status)}
            </Badge>
            {item.impact && (
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Impact {item.impact}
              </span>
            )}
            {item.effort && (
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Effort {item.effort}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">{item.issueText}</p>
          {item.totalScanned > 0 && item.status !== 'good' && (
            <p className="mt-1 text-xs text-muted-foreground">
              {item.issueCount} of {item.totalScanned}{' '}
              {item.totalScanned === 1 ? 'page' : 'pages'}
              {item.worstPage ? ` · worst ${item.worstPage}` : ''}
            </p>
          )}
        </div>
        <span className="mt-1 shrink-0 text-xs text-muted-foreground print:hidden" aria-hidden>
          {open ? 'Hide' : 'Show'}
        </span>
      </button>

      <div
        hidden={!open}
        className="finding-body space-y-5 border-t border-border p-4 sm:p-5"
      >
        <section>
          <h5 className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Evidence
          </h5>
          <div className="rounded-2xl border border-border bg-muted/40 px-3 py-2.5 font-mono text-sm break-all">
            {item.currentValue || '—'}
          </div>
          {item.snippet && (
            <pre className="mt-3 overflow-x-auto rounded-2xl border border-border bg-muted p-4 text-xs">
              <code>{item.snippet}</code>
            </pre>
          )}
        </section>

        <section>
          <h5 className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Why it matters
          </h5>
          <p className="text-sm leading-relaxed text-muted-foreground">{item.whyItMatters}</p>
        </section>

        {item.status !== 'good' && (
          <section>
            <h5 className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              How to fix
            </h5>
            <p className="text-sm leading-relaxed">{item.howToFix}</p>
          </section>
        )}

        {issuePages.length > 0 && (
          <section>
            <h5 className="mb-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Pages with this issue
            </h5>
            <ul className="space-y-2">
              {issuePages.slice(0, 8).map((page) => (
                <li
                  key={`${page.path}-${page.status}-${page.value}`}
                  className="rounded-2xl border border-border bg-background px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs break-all">{page.path}</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] uppercase tracking-[0.12em]',
                        statusBadgeClass(page.status)
                      )}
                    >
                      {statusLabel(page.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{page.message}</p>
                  {page.value && (
                    <p className="mt-1 font-mono text-xs break-all text-muted-foreground">
                      {page.value}
                    </p>
                  )}
                  <ExtraFields
                    item={page as unknown as Record<string, unknown>}
                    knownKeys={PAGE_BREAKDOWN_KNOWN_KEYS}
                  />
                </li>
              ))}
            </ul>
            {extraPages > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">and {extraPages} more pages</p>
            )}
          </section>
        )}

        <ExtraFields item={loose} knownKeys={AGGREGATED_KNOWN_KEYS} />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
          {item.wcag && (
            <span className="text-xs text-muted-foreground">WCAG {item.wcag}</span>
          )}
          {item.reference && (
            <a
              href={item.reference}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline underline-offset-4"
            >
              Official documentation
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

export function ReportFindings({
  checksByCategory,
}: {
  checksByCategory: Record<string, AggregatedCheck[]>
}) {
  const [filter, setFilter] = useState<StatusFilter>('all')

  const categories = useMemo(() => orderedCategories(checksByCategory), [checksByCategory])
  const allChecks = useMemo(
    () => categories.flatMap((cat) => checksByCategory[cat] || []),
    [categories, checksByCategory]
  )
  const counts = statusCounts(allChecks)

  const filters: { id: StatusFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'critical', label: 'Fail', count: counts.critical },
    { id: 'warning', label: 'Warn', count: counts.warning },
    { id: 'good', label: 'Pass', count: counts.good },
  ]

  function matches(item: AggregatedCheck) {
    return filter === 'all' || item.status === filter
  }

  if (allChecks.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
        <h3 className="font-display text-xl">No categorized checks</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This report has no check groups to filter.
        </p>
      </div>
    )
  }

  return (
    <div>
      <style>{`@media print { .finding-body { display: block !important; } }`}</style>
      <nav
        aria-label="Check categories"
        className="sticky top-20 z-20 -mx-4 mb-4 border-y border-border bg-background/90 px-4 py-2.5 backdrop-blur-md print:hidden sm:mx-0 sm:rounded-full sm:border sm:px-3"
      >
        <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
          {categories.map((cat) => {
            const items = checksByCategory[cat] || []
            const visible = items.filter(matches).length
            const meta = categoryInfo(cat)
            return (
              <a
                key={cat}
                href={`#category-${cat}`}
                className={cn(
                  'shrink-0 rounded-full border border-border px-3 py-1.5 text-xs whitespace-nowrap',
                  visible === 0
                    ? 'text-muted-foreground/50'
                    : 'text-muted-foreground hover:border-foreground/20 hover:text-foreground'
                )}
              >
                {meta.label}
                <span className="ml-1 tabular-nums">{visible}</span>
              </a>
            )
          })}
        </div>
      </nav>

      <div className="mb-8 flex flex-wrap gap-2 print:hidden">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm sm:px-3.5 sm:py-2',
              filter === f.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
            <span className="ml-1.5 tabular-nums opacity-80">{f.count}</span>
          </button>
        ))}
      </div>

      <div className="space-y-10">
        {categories.map((category) => {
          const items = (checksByCategory[category] || []).filter(matches)
          const meta = categoryInfo(category)
          return (
            <section
              key={category}
              id={`category-${category}`}
              className="scroll-mt-40"
            >
              <h3 className="mb-2 flex items-center justify-between gap-3 border-b border-border pb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <span>{meta.label}</span>
                <span className="tabular-nums font-normal normal-case tracking-normal">
                  {items.length} shown
                </span>
              </h3>
              {meta.blurb && (
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{meta.blurb}</p>
              )}
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No checks match this filter.</p>
              ) : (
                <div className="grid gap-3">
                  {items.map((item) => (
                    <FindingRow
                      key={`${filter}-${item.id}`}
                      item={item}
                      defaultOpen={item.status !== 'good'}
                    />
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
