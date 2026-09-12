import type {
  AggregatedCheck,
  CheckCategory,
  CheckStatus,
  CrawlCoverage,
  ScanSummary,
} from '@/lib/scanner'
import { HOBBY_MAX_PAGES, PRO_MAX_PAGES } from '@/lib/crawl-limits'

export const CATEGORY_ORDER: CheckCategory[] = [
  'meta',
  'content',
  'technical',
  'performance',
  'social',
  'accessibility',
  'security',
  'links',
  'images',
  'structured-data',
  'ai-search',
  'domain',
]

export const CATEGORY_META: Record<
  CheckCategory,
  { label: string; blurb?: string }
> = {
  meta: { label: 'Meta' },
  content: { label: 'Content' },
  technical: { label: 'Technical' },
  performance: {
    label: 'Performance hints',
    blurb:
      'HTML size, caching, compression, lazy-load, and render-blocking hints from the first document and response headers — not field Core Web Vitals (LCP, INP, CLS).',
  },
  social: { label: 'Social' },
  accessibility: { label: 'Accessibility' },
  security: { label: 'Security' },
  links: { label: 'Links' },
  images: { label: 'Images' },
  'structured-data': { label: 'Structured data' },
  'ai-search': {
    label: 'AI search',
    blurb:
      'Eligibility heuristics (snippet, robots for AI crawlers, extractable text, optional llms.txt). Not a GEO score, citation percentage, or AI Overview badge. Missing llms.txt is not a fail.',
  },
  domain: { label: 'Domain' },
}

export type StatusFilter = 'all' | CheckStatus

export function statusLabel(status: CheckStatus): string {
  if (status === 'critical') return 'Fail'
  if (status === 'warning') return 'Warn'
  return 'Pass'
}

export function statusCounts(checks: AggregatedCheck[]) {
  return {
    all: checks.length,
    critical: checks.filter((c) => c.status === 'critical').length,
    warning: checks.filter((c) => c.status === 'warning').length,
    good: checks.filter((c) => c.status === 'good').length,
  }
}

export function hostnameFromUrl(raw: string): string {
  try {
    return new URL(raw).hostname
  } catch {
    return raw
  }
}

export function planCapLabel(cap: number): string {
  if (cap === HOBBY_MAX_PAGES) return `Hobby cap · ${HOBBY_MAX_PAGES} pages`
  if (cap === PRO_MAX_PAGES) return `Pro cap · ${PRO_MAX_PAGES} pages`
  return `Cap · ${cap} pages`
}

export function coverageHeadline(coverage: CrawlCoverage): string {
  const cap = planCapLabel(coverage.cap)
  if (coverage.stopReason === 'cap') {
    return `Stopped at the ${cap} — not the whole site.`
  }
  return `Finished under the ${cap}.`
}

export function gradeTone(grade: ScanSummary['grade']): string {
  if (grade === 'A' || grade === 'B') return '#3d6b4f'
  if (grade === 'C' || grade === 'D') return '#c47a4a'
  return '#b42318'
}

export function formatDuration(ms: number | undefined): string | null {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return null
  if (ms < 1000) return `${Math.round(ms)} ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)
  return `${minutes}m ${rest}s`
}

export function formatScannedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString()
}

export function stopReasonLabel(reason: CrawlCoverage['stopReason'] | string | undefined): string {
  if (reason === 'cap') return 'Stopped at plan cap — not the whole site'
  if (reason === 'complete') return 'Finished under the plan cap'
  if (typeof reason === 'string' && reason.trim()) {
    return reason.replace(/-/g, ' ')
  }
  return 'Stop reason not stored'
}

export function categoryInfo(category: string): { label: string; blurb?: string } {
  if (category in CATEGORY_META) return CATEGORY_META[category as CheckCategory]
  return { label: category.replace(/-/g, ' ') }
}

export function orderedCategories(
  checksByCategory: Record<string, AggregatedCheck[] | undefined>
): string[] {
  const known = CATEGORY_ORDER.filter((cat) => (checksByCategory[cat] || []).length > 0)
  const extra = Object.keys(checksByCategory).filter(
    (cat) => !CATEGORY_ORDER.includes(cat as CheckCategory) && (checksByCategory[cat] || []).length > 0
  )
  extra.sort((a, b) => a.localeCompare(b))
  return [...known, ...extra]
}

export function groupChecks(
  checksByCategory: Record<string, AggregatedCheck[] | undefined> | undefined,
  fallback: AggregatedCheck[]
): Record<string, AggregatedCheck[]> {
  const hasGrouped = Boolean(
    checksByCategory && Object.values(checksByCategory).some((list) => (list?.length ?? 0) > 0)
  )
  if (hasGrouped && checksByCategory) {
    return Object.fromEntries(
      Object.entries(checksByCategory).map(([key, list]) => [key, list ?? []])
    )
  }
  const grouped: Record<string, AggregatedCheck[]> = {}
  for (const check of fallback) {
    const cat = check.category || 'other'
    ;(grouped[cat] ??= []).push(check)
  }
  return grouped
}

export const AGGREGATED_KNOWN_KEYS = new Set([
  'id',
  'label',
  'category',
  'status',
  'currentValue',
  'issueCount',
  'totalScanned',
  'issueText',
  'whyItMatters',
  'howToFix',
  'snippet',
  'reference',
  'wcag',
  'effort',
  'impact',
  'worstPage',
  'pageBreakdown',
])

export const PAGE_BREAKDOWN_KNOWN_KEYS = new Set(['path', 'status', 'value', 'message'])

const EXTRA_FIELD_LABELS: Record<string, string> = {
  evidence: 'Extra evidence',
  evidenceText: 'Evidence note',
  notes: 'Notes',
  sources: 'Sources',
  affectedUrls: 'Affected URLs',
  affectedPages: 'Affected pages',
  examples: 'Examples',
  details: 'Details',
  recommendation: 'Recommendation',
  code: 'Code',
  confidence: 'Confidence',
  observed: 'Observed',
  proof: 'Proof',
  measurement: 'Measurement',
  method: 'Method',
  hint: 'Hint',
  citations: 'Citations',
  severity: 'Severity',
  pages: 'Pages',
}

function labelForExtraKey(key: string): string {
  if (EXTRA_FIELD_LABELS[key]) return EXTRA_FIELD_LABELS[key]
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/^\w/, (ch) => ch.toUpperCase())
}

export function formatExtraValue(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => {
        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
          return String(item)
        }
        if (item && typeof item === 'object') {
          const rec = item as Record<string, unknown>
          if (typeof rec.path === 'string') return rec.path
          if (typeof rec.url === 'string') return rec.url
          if (typeof rec.href === 'string') return rec.href
          try {
            return JSON.stringify(item)
          } catch {
            return null
          }
        }
        return null
      })
      .filter((part): part is string => Boolean(part))
    return parts.length ? parts.join('\n') : null
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return null
    }
  }
  return null
}

export function extraFindingEntries(
  item: Record<string, unknown>,
  knownKeys: Set<string> = AGGREGATED_KNOWN_KEYS
): { key: string; label: string; value: string }[] {
  const out: { key: string; label: string; value: string }[] = []
  for (const [key, raw] of Object.entries(item)) {
    if (knownKeys.has(key)) continue
    if (typeof raw === 'function') continue
    const value = formatExtraValue(raw)
    if (!value) continue
    out.push({ key, label: labelForExtraKey(key), value })
  }
  out.sort((a, b) => a.label.localeCompare(b.label))
  return out
}
