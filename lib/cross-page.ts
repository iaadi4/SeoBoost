import * as cheerio from 'cheerio'
import type { CheckCategory, CheckResult, CheckStatus } from '@/lib/scanner'

/** Unique cross-page check IDs. Orphans are not emitted — crawl session stores no edge list. */
export const CROSS_PAGE_CHECK_IDS = {
  DUPLICATE_TITLES: 'duplicate-titles',
  DUPLICATE_DESCRIPTIONS: 'duplicate-descriptions',
  CANONICAL_GAPS: 'canonical-gaps',
  CANONICAL_CONFLICTS: 'canonical-conflicts',
  DUPLICATE_H1: 'duplicate-h1',
} as const

export type CrossPageCheckId = (typeof CROSS_PAGE_CHECK_IDS)[keyof typeof CROSS_PAGE_CHECK_IDS]

/** Fields already parsed from crawled HTML — not a link graph. */
export interface PageMetaSnapshot {
  url: string
  path: string
  title: string
  description: string
  canonical: string
  h1: string
}

/**
 * Finding shape used by this lane: id, severity, evidence (URLs), fix.
 * Mapped onto CheckResult (status / howToFix) for finalizeReport.
 */
export interface CrossPageFinding {
  id: CrossPageCheckId
  severity: CheckStatus
  evidence: string[]
  fix: string
  label: string
  category: CheckCategory
  value: string
  message: string
  whyItMatters: string
  snippet?: string
  reference?: string
  effort?: 'low' | 'medium' | 'high'
  impact?: 'low' | 'medium' | 'high'
}

const TITLE_REF = 'https://developers.google.com/search/docs/appearance/title-link'
const SNIPPET_REF = 'https://developers.google.com/search/docs/appearance/snippet'
const CANON_REF = 'https://developers.google.com/search/docs/crawling-indexing/canonicalization'

export function pathFromUrl(urlStr: string): string {
  try {
    const url = new URL(urlStr)
    let path = url.pathname || '/'
    if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1)
    return path
  } catch {
    return urlStr
  }
}

export function pageMetaFromHtml(urlStr: string, html: string): PageMetaSnapshot {
  const $ = cheerio.load(html)
  return {
    url: urlStr,
    path: pathFromUrl(urlStr),
    title: $('title').first().text().trim(),
    description: $('meta[name="description"]').attr('content')?.trim() ?? '',
    canonical: $('link[rel="canonical"]').attr('href')?.trim() ?? '',
    h1: $('h1').first().text().trim(),
  }
}

export function snapshotFromParsed(input: {
  url: string
  path: string
  title: string
  description: string
  canonical: string
  h1: string
}): PageMetaSnapshot {
  return {
    url: input.url,
    path: input.path,
    title: input.title.trim(),
    description: input.description.trim(),
    canonical: input.canonical.trim(),
    h1: input.h1.trim(),
  }
}

/** Collapse whitespace so two titles that differ only by spaces still match. */
export function normText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

/**
 * Same normalisation the per-page canonical check uses (scheme / www / slash / default port).
 * Relative hrefs must be resolved against the page URL first.
 */
export function normalizeCanon(raw: string): string {
  if (!raw) return ''
  return raw
    .replace(/\/+$/, '')
    .replace(/^http:\/\//, 'https://')
    .replace(/^https?:\/\/www\./, 'https://')
    .replace(/:80(\/|$)/, '$1')
    .replace(/:443(\/|$)/, '$1')
}

export function resolveCanonical(pageUrl: string, canonical: string): string {
  if (!canonical) return ''
  try {
    return new URL(canonical, pageUrl).href
  } catch {
    return canonical
  }
}

function clusterBy(
  pages: PageMetaSnapshot[],
  field: 'title' | 'description' | 'h1',
  minSize: number
): Array<{ key: string; urls: string[] }> {
  const map = new Map<string, string[]>()
  for (const page of pages) {
    const key = normText(page[field])
    if (!key) continue
    const list = map.get(key) ?? []
    list.push(page.url)
    map.set(key, list)
  }
  return [...map.entries()]
    .filter(([, urls]) => urls.length >= minSize)
    .map(([key, urls]) => ({ key, urls }))
    .sort((a, b) => b.urls.length - a.urls.length || a.key.localeCompare(b.key))
}

function listUrls(urls: string[], cap = 8): string {
  const shown = urls.slice(0, cap)
  const extra = urls.length - shown.length
  return extra > 0 ? `${shown.join(', ')} (+${extra} more)` : shown.join(', ')
}

function finding(partial: CrossPageFinding): CrossPageFinding {
  return partial
}

function uniqueFieldFinding(
  id: CrossPageCheckId,
  label: string,
  category: CheckCategory,
  field: 'title' | 'description' | 'h1',
  fieldLabel: string,
  clusters: Array<{ key: string; urls: string[] }>,
  pages: PageMetaSnapshot[],
  opts: {
    why: string
    fix: string
    snippet: string
    reference: string
    minCompare: number
    criticalAt: number
    emptyNote: string
  }
): CrossPageFinding {
  if (pages.length < opts.minCompare) {
    return finding({
      id,
      label,
      category,
      severity: 'good',
      evidence: [],
      fix: opts.fix,
      value: 'Not compared',
      message: `Need ${opts.minCompare}+ crawled pages to compare ${fieldLabel}s`,
      whyItMatters: opts.why,
      snippet: opts.snippet,
      reference: opts.reference,
      effort: 'low',
      impact: 'medium',
    })
  }

  const compared = pages.filter((p) => normText(p[field])).length
  if (clusters.length === 0) {
    return finding({
      id,
      label,
      category,
      severity: 'good',
      evidence: [],
      fix: opts.fix,
      value: compared === 0 ? opts.emptyNote : `All unique`,
      message:
        compared === 0
          ? opts.emptyNote
          : `All ${compared} crawled ${fieldLabel}${compared === 1 ? '' : 's'} are unique`,
      whyItMatters: opts.why,
      snippet: opts.snippet,
      reference: opts.reference,
      effort: 'low',
      impact: 'low',
    })
  }

  const evidence = [...new Set(clusters.flatMap((c) => c.urls))]
  const largest = clusters[0]!
  const worst = Math.max(...clusters.map((c) => c.urls.length))
  const severity: CheckStatus = worst >= opts.criticalAt ? 'critical' : 'warning'
  const preview = largest.key.length > 48 ? `${largest.key.slice(0, 45)}…` : largest.key

  return finding({
    id,
    label,
    category,
    severity,
    evidence,
    fix: `${opts.fix} Affected URLs: ${listUrls(evidence)}.`,
    value:
      clusters.length === 1
        ? `${largest.urls.length} pages share “${preview}”`
        : `${clusters.length} reused ${fieldLabel} clusters (${evidence.length} URLs)`,
    message:
      clusters.length === 1
        ? `${largest.urls.length} crawled URLs share the ${fieldLabel} “${preview}”: ${listUrls(largest.urls)}`
        : `${clusters.length} ${fieldLabel} clusters are reused. Largest: “${preview}” on ${largest.urls.length} URLs (${listUrls(evidence)})`,
    whyItMatters: opts.why,
    snippet: opts.snippet,
    reference: opts.reference,
    effort: 'low',
    impact: severity === 'critical' ? 'high' : 'medium',
  })
}

function canonicalGaps(pages: PageMetaSnapshot[]): CrossPageFinding {
  const id = CROSS_PAGE_CHECK_IDS.CANONICAL_GAPS
  const label = 'Canonicals across pages'
  const why =
    'Across a crawled set, missing rel=canonical leaves URL variants (slash, www, parameters) without an explicit preferred URL. This is a crawl-set observation, not a ranking score.'
  const fix =
    'Add one self-referencing rel=canonical on each indexable URL, or point variants at the single URL you want indexed.'
  const snippet = '<link rel="canonical" href="https://example.com/preferred-url">'

  if (pages.length < 2) {
    return finding({
      id,
      label,
      category: 'meta',
      severity: 'good',
      evidence: [],
      fix,
      value: 'Not compared',
      message: 'Need 2+ crawled pages to compare canonicals',
      whyItMatters: why,
      snippet,
      reference: CANON_REF,
      effort: 'low',
      impact: 'medium',
    })
  }

  const missing = pages.filter((p) => !p.canonical.trim())
  if (missing.length === 0) {
    return finding({
      id,
      label,
      category: 'meta',
      severity: 'good',
      evidence: [],
      fix,
      value: 'Present on all crawled pages',
      message: `All ${pages.length} crawled pages include a rel=canonical`,
      whyItMatters: why,
      snippet,
      reference: CANON_REF,
      effort: 'low',
      impact: 'low',
    })
  }

  const evidence = missing.map((p) => p.url)
  return finding({
    id,
    label,
    category: 'meta',
    severity: 'warning',
    evidence,
    fix: `${fix} Missing on: ${listUrls(evidence)}.`,
    value: `${missing.length} / ${pages.length} missing`,
    message: `${missing.length} of ${pages.length} crawled URLs have no rel=canonical: ${listUrls(evidence)}`,
    whyItMatters: why,
    snippet,
    reference: CANON_REF,
    effort: 'low',
    impact: 'medium',
  })
}

function canonicalConflicts(pages: PageMetaSnapshot[]): CrossPageFinding {
  const id = CROSS_PAGE_CHECK_IDS.CANONICAL_CONFLICTS
  const label = 'Canonical conflicts'
  const why =
    'When crawled pages point at each other or at a crawled target that names a different preferred URL, the set disagrees on the canonical. Only evaluated when at least one rel=canonical exists in the crawl.'
  const fix =
    'Pick one preferred URL per document. Every variant should point at that URL; the preferred URL should self-canonicalise. Do not create A→B and B→A cycles.'
  const snippet = '<link rel="canonical" href="https://example.com/preferred-url">'

  const withCanon = pages.filter((p) => p.canonical.trim())
  if (pages.length < 2 || withCanon.length === 0) {
    return finding({
      id,
      label,
      category: 'meta',
      severity: 'good',
      evidence: [],
      fix,
      value: withCanon.length === 0 ? 'No canonicals to compare' : 'Not compared',
      message:
        withCanon.length === 0
          ? 'No crawled page has a rel=canonical, so conflicts are not evaluated'
          : 'Need 2+ crawled pages to compare canonicals',
      whyItMatters: why,
      snippet,
      reference: CANON_REF,
      effort: 'low',
      impact: 'medium',
    })
  }

  const byNormUrl = new Map<string, PageMetaSnapshot>()
  for (const page of pages) {
    byNormUrl.set(normalizeCanon(page.url), page)
  }

  const conflictUrls = new Set<string>()
  const notes: string[] = []

  for (const page of withCanon) {
    const self = normalizeCanon(page.url)
    const target = normalizeCanon(resolveCanonical(page.url, page.canonical))
    if (!target || target === self) continue

    const targetPage = byNormUrl.get(target)
    if (!targetPage) continue

    const targetSelf = normalizeCanon(targetPage.url)
    const targetCanon = targetPage.canonical.trim()
      ? normalizeCanon(resolveCanonical(targetPage.url, targetPage.canonical))
      : ''

    if (!targetCanon) {
      conflictUrls.add(page.url)
      conflictUrls.add(targetPage.url)
      notes.push(`${page.url} points at ${targetPage.url}, which has no canonical`)
      continue
    }

    if (targetCanon !== targetSelf) {
      conflictUrls.add(page.url)
      conflictUrls.add(targetPage.url)
      if (targetCanon === self) {
        notes.push(`${page.url} and ${targetPage.url} point at each other`)
      } else {
        notes.push(
          `${page.url} names ${targetPage.url} as canonical, but that page names ${targetPage.canonical}`
        )
      }
    }
  }

  if (conflictUrls.size === 0) {
    return finding({
      id,
      label,
      category: 'meta',
      severity: 'good',
      evidence: [],
      fix,
      value: 'No conflicts in crawl set',
      message: `Crawled canonicals that name another crawled URL agree on a preferred target (${withCanon.length} tagged pages)`,
      whyItMatters: why,
      snippet,
      reference: CANON_REF,
      effort: 'low',
      impact: 'low',
    })
  }

  const evidence = [...conflictUrls]
  return finding({
    id,
    label,
    category: 'meta',
    severity: evidence.length >= 4 ? 'critical' : 'warning',
    evidence,
    fix: `${fix} ${notes[0] ?? ''}`,
    value: `${evidence.length} URLs disagree`,
    message: `${notes[0] ?? 'Canonical targets disagree'}. Evidence: ${listUrls(evidence)}`,
    whyItMatters: why,
    snippet,
    reference: CANON_REF,
    effort: 'low',
    impact: 'high',
  })
}

/** Compare crawled page snapshots. Does not invent a link graph or orphan list. */
export function evaluateCrossPage(pages: PageMetaSnapshot[]): CrossPageFinding[] {
  const titleClusters = clusterBy(pages, 'title', 2)
  const descClusters = clusterBy(pages, 'description', 2)
  const h1Clusters = clusterBy(pages, 'h1', 3)

  return [
    uniqueFieldFinding(
      CROSS_PAGE_CHECK_IDS.DUPLICATE_TITLES,
      'Duplicate titles',
      'meta',
      'title',
      'title',
      titleClusters,
      pages,
      {
        why: 'Google asks for a unique, descriptive title per URL. Reused titles make listings harder to tell apart and may be rewritten.',
        fix: 'Write a unique <title> that names the specific page, not a shared site-wide string.',
        snippet: '<title>Unique page topic – Brand</title>',
        reference: TITLE_REF,
        minCompare: 2,
        criticalAt: 3,
        emptyNote: 'No titles to compare',
      }
    ),
    uniqueFieldFinding(
      CROSS_PAGE_CHECK_IDS.DUPLICATE_DESCRIPTIONS,
      'Duplicate meta descriptions',
      'meta',
      'description',
      'description',
      descClusters,
      pages,
      {
        why: 'Meta descriptions are optional CTR copy. The same description on many URLs is less likely to be used and does not describe each page.',
        fix: 'Write a unique meta description per URL that summarises that page.',
        snippet: '<meta name="description" content="Unique summary of this page.">',
        reference: SNIPPET_REF,
        minCompare: 2,
        criticalAt: 3,
        emptyNote: 'No meta descriptions to compare',
      }
    ),
    canonicalGaps(pages),
    canonicalConflicts(pages),
    uniqueFieldFinding(
      CROSS_PAGE_CHECK_IDS.DUPLICATE_H1,
      'Duplicate H1s',
      'content',
      'h1',
      'H1',
      h1Clusters,
      pages,
      {
        why: 'The same visible H1 on many crawled URLs makes those pages harder to tell apart. This is a uniqueness check, not a ranking score.',
        fix: 'Give each URL a page-specific H1. If a logo H1 is site-wide, move the logo out of H1 and keep one topical H1 in main content.',
        snippet: '<h1>Page-specific heading</h1>',
        reference: TITLE_REF,
        minCompare: 2,
        criticalAt: 6,
        emptyNote: 'No H1s to compare',
      }
    ),
  ]
}

export function findingsToChecks(findings: CrossPageFinding[]): CheckResult[] {
  return findings.map((f) => ({
    id: f.id,
    label: f.label,
    category: f.category,
    status: f.severity,
    value: f.value,
    message: f.message,
    whyItMatters: f.whyItMatters,
    howToFix: f.fix,
    snippet: f.snippet,
    reference: f.reference,
    effort: f.effort,
    impact: f.impact,
    evidence: f.evidence,
  }))
}

export function evaluateCrossPageChecks(pages: PageMetaSnapshot[]): CheckResult[] {
  return findingsToChecks(evaluateCrossPage(pages))
}
