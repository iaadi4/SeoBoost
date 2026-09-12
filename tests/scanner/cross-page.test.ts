import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  CROSS_PAGE_CHECK_IDS,
  evaluateCrossPage,
  pageMetaFromHtml,
} from '@/lib/cross-page'
import {
  analysePage,
  finalizeReport,
  type AnalysePageResult,
  type CrawlSession,
  type ScanOptions,
} from '@/lib/scanner'

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')

function loadFixture(name: string) {
  return readFileSync(join(fixturesDir, name), 'utf8')
}

function meta(name: string, url: string) {
  return pageMetaFromHtml(url, loadFixture(name))
}

function byId(findings: ReturnType<typeof evaluateCrossPage>) {
  return Object.fromEntries(findings.map((f) => [f.id, f]))
}

const TEST_OPTS: Required<ScanOptions> = {
  maxPages: 50,
  fetchTimeoutMs: 10_000,
  stripTrackingParams: true,
  userAgent: 'cross-page-test',
  revalidate: 0,
  politenessDelayMs: 0,
  fetchRetries: 0,
}

function reportFromAnalysed(pages: AnalysePageResult[]) {
  const session: CrawlSession = {
    origin: 'https://example.com',
    opts: TEST_OPTS,
    queue: [],
    queued: [],
    visited: pages.map((p) => p.url),
    discovered: pages.map((p) => p.url),
    rawPages: pages,
    domainChecks: [],
    robotsDisallowed: [],
    lastFetchAt: 0,
    startedAt: Date.now(),
  }
  return finalizeReport(session)
}

describe('pageMetaFromHtml fixtures', () => {
  it('reads title, description, canonical, and H1 from fixture HTML', () => {
    const snap = meta('cross-page-unique-a.html', 'https://example.com/about')
    expect(snap.title).toBe('About Example Company')
    expect(snap.description).toMatch(/About Example/)
    expect(snap.canonical).toBe('https://example.com/about')
    expect(snap.h1).toBe('About Example')
    expect(snap.path).toBe('/about')
  })
})

describe('duplicate titles and descriptions', () => {
  it('flags two fixture URLs that share a title and description', () => {
    const findings = byId(
      evaluateCrossPage([
        meta('cross-page-dup-a.html', 'https://example.com/services'),
        meta('cross-page-dup-b.html', 'https://example.com/pricing'),
      ])
    )
    expect(findings['duplicate-titles'].severity).toBe('warning')
    expect(findings['duplicate-titles'].evidence).toEqual([
      'https://example.com/services',
      'https://example.com/pricing',
    ])
    expect(findings['duplicate-titles'].fix).toMatch(/unique <title>/i)
    expect(findings['duplicate-descriptions'].severity).toBe('warning')
    expect(findings['duplicate-descriptions'].evidence).toHaveLength(2)
  })

  it('marks three identical titles critical', () => {
    const findings = byId(
      evaluateCrossPage([
        meta('cross-page-dup-a.html', 'https://example.com/services'),
        meta('cross-page-dup-b.html', 'https://example.com/pricing'),
        meta('cross-page-dup-c.html', 'https://example.com/team'),
      ])
    )
    expect(findings['duplicate-titles'].severity).toBe('critical')
    expect(findings['duplicate-titles'].evidence).toHaveLength(3)
    expect(findings['duplicate-descriptions'].severity).toBe('critical')
  })

  it('passes unique brochure fixtures', () => {
    const findings = byId(
      evaluateCrossPage([
        meta('cross-page-unique-a.html', 'https://example.com/about'),
        meta('cross-page-unique-b.html', 'https://example.com/pricing'),
      ])
    )
    expect(findings['duplicate-titles'].severity).toBe('good')
    expect(findings['duplicate-titles'].evidence).toEqual([])
    expect(findings['duplicate-descriptions'].severity).toBe('good')
  })

  it('does not treat empty titles as a duplicate cluster', () => {
    const findings = byId(
      evaluateCrossPage([
        { url: 'https://example.com/a', path: '/a', title: '', description: '', canonical: '', h1: '' },
        { url: 'https://example.com/b', path: '/b', title: '', description: '', canonical: '', h1: '' },
      ])
    )
    expect(findings['duplicate-titles'].severity).toBe('good')
    expect(findings['duplicate-titles'].message).toMatch(/No titles to compare/)
  })
})

describe('canonical gaps and conflicts', () => {
  it('lists URLs missing rel=canonical', () => {
    const findings = byId(
      evaluateCrossPage([
        meta('cross-page-no-canon-a.html', 'https://example.com/docs'),
        meta('cross-page-no-canon-b.html', 'https://example.com/docs/install'),
      ])
    )
    expect(findings['canonical-gaps'].severity).toBe('warning')
    expect(findings['canonical-gaps'].evidence).toEqual([
      'https://example.com/docs',
      'https://example.com/docs/install',
    ])
    expect(findings['canonical-conflicts'].severity).toBe('good')
    expect(findings['canonical-conflicts'].message).toMatch(/No crawled page has a rel=canonical/)
  })

  it('flags A→B / B→A cycles among crawled pages', () => {
    const findings = byId(
      evaluateCrossPage([
        meta('cross-page-canon-cycle-a.html', 'https://example.com/variant-a'),
        meta('cross-page-canon-cycle-b.html', 'https://example.com/variant-b'),
      ])
    )
    expect(findings['canonical-conflicts'].severity).toBe('warning')
    expect(findings['canonical-conflicts'].evidence.sort()).toEqual([
      'https://example.com/variant-a',
      'https://example.com/variant-b',
    ])
    expect(findings['canonical-conflicts'].message).toMatch(/point at each other/)
    expect(findings['canonical-gaps'].severity).toBe('good')
  })

  it('does not flag a variant that points at a self-canonical preferred URL', () => {
    const findings = byId(
      evaluateCrossPage([
        meta('cross-page-canon-ok-a.html', 'https://example.com/product/print'),
        meta('cross-page-canon-ok-b.html', 'https://example.com/product'),
      ])
    )
    expect(findings['canonical-conflicts'].severity).toBe('good')
    expect(findings['canonical-gaps'].severity).toBe('good')
  })
})

describe('duplicate H1 (optional)', () => {
  it('warns when the same H1 appears on three crawled URLs', () => {
    const findings = byId(
      evaluateCrossPage([
        meta('cross-page-dup-a.html', 'https://example.com/services'),
        meta('cross-page-dup-b.html', 'https://example.com/pricing'),
        meta('cross-page-dup-c.html', 'https://example.com/team'),
      ])
    )
    expect(findings['duplicate-h1'].severity).toBe('warning')
    expect(findings['duplicate-h1'].evidence).toHaveLength(3)
  })

  it('does not flag the same H1 on only two URLs', () => {
    const findings = byId(
      evaluateCrossPage([
        meta('cross-page-dup-a.html', 'https://example.com/services'),
        meta('cross-page-dup-b.html', 'https://example.com/pricing'),
      ])
    )
    expect(findings['duplicate-h1'].severity).toBe('good')
  })
})

describe('no invented orphan graph', () => {
  it('never emits an orphan or in-degree check id', () => {
    const findings = evaluateCrossPage([
      meta('cross-page-unique-a.html', 'https://example.com/about'),
      meta('cross-page-unique-b.html', 'https://example.com/pricing'),
    ])
    expect(findings.map((f) => f.id).sort()).toEqual(
      [
        CROSS_PAGE_CHECK_IDS.CANONICAL_CONFLICTS,
        CROSS_PAGE_CHECK_IDS.CANONICAL_GAPS,
        CROSS_PAGE_CHECK_IDS.DUPLICATE_DESCRIPTIONS,
        CROSS_PAGE_CHECK_IDS.DUPLICATE_H1,
        CROSS_PAGE_CHECK_IDS.DUPLICATE_TITLES,
      ].sort()
    )
    expect(findings.some((f) => /orphan|in-?degree|inlinks/i.test(f.id))).toBe(false)
  })
})

describe('finalizeReport hook', () => {
  it('wires duplicate-titles into the existing aggregated finding shape', () => {
    const pages = [
      analysePage(
        'https://example.com/services',
        loadFixture('cross-page-dup-a.html'),
        {},
        new URL('https://example.com')
      ),
      analysePage(
        'https://example.com/pricing',
        loadFixture('cross-page-dup-b.html'),
        {},
        new URL('https://example.com')
      ),
    ]
    expect(pages[0]!.meta.title).toBe('Shared Brochure Title')
    const report = reportFromAnalysed(pages)
    const check = report.aggregatedChecks.find((c) => c.id === 'duplicate-titles')
    expect(check).toBeDefined()
    expect(check!.status).toBe('warning')
    expect(check!.howToFix).toMatch(/unique <title>/i)
    expect(check!.pageBreakdown?.map((p) => p.path).sort()).toEqual([
      '/pricing',
      '/services',
    ])
  })

  it('emits all five cross-page ids on a unique two-page set', () => {
    const report = reportFromAnalysed([
      analysePage(
        'https://example.com/about',
        loadFixture('cross-page-unique-a.html'),
        {},
        new URL('https://example.com')
      ),
      analysePage(
        'https://example.com/pricing',
        loadFixture('cross-page-unique-b.html'),
        {},
        new URL('https://example.com')
      ),
    ])
    const ids = report.aggregatedChecks.map((c) => c.id)
    expect(ids).toEqual(
      expect.arrayContaining([
        'duplicate-titles',
        'duplicate-descriptions',
        'canonical-gaps',
        'canonical-conflicts',
        'duplicate-h1',
      ])
    )
    expect(ids).not.toEqual(expect.arrayContaining(['orphan-pages']))
    for (const id of [
      'duplicate-titles',
      'duplicate-descriptions',
      'canonical-gaps',
      'canonical-conflicts',
      'duplicate-h1',
    ]) {
      expect(report.aggregatedChecks.find((c) => c.id === id)?.status).toBe('good')
    }
  })
})
