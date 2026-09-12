import { describe, expect, it } from 'vitest'
import {
  calculatePageScore,
  coverageFromSession,
  crawlIsDone,
  finalizeReport,
  SCORE_WEIGHTS,
  type CheckCategory,
  type CheckResult,
  type CheckStatus,
  type CrawlSession,
  type ScanOptions,
} from '@/lib/scanner'
import { HOBBY_MAX_PAGES, maxPagesForPlan, PRO_MAX_PAGES } from '@/lib/crawl-limits'
import { evaluateLlmsTxt } from '@/lib/ai-search'
import { CHECK_CATEGORIES } from '@/lib/claims'

const defaultOpts: Required<ScanOptions> = {
  maxPages: HOBBY_MAX_PAGES,
  fetchTimeoutMs: 10_000,
  stripTrackingParams: true,
  userAgent: 'test',
  revalidate: 0,
  politenessDelayMs: 0,
  fetchRetries: 0,
}

function fakeCheck(
  id: string,
  status: CheckStatus,
  category: CheckCategory = 'meta'
): CheckResult {
  return {
    id,
    label: id,
    category,
    status,
    value: status,
    message: `${id} ${status}`,
    whyItMatters: 'why',
    howToFix: 'fix',
    impact: 'high',
  }
}

function session(partial: Partial<CrawlSession> = {}): CrawlSession {
  return {
    origin: 'https://example.com',
    opts: defaultOpts,
    queue: [],
    queued: [],
    visited: [],
    discovered: [],
    rawPages: [],
    domainChecks: [],
    robotsDisallowed: [],
    lastFetchAt: 0,
    startedAt: Date.now(),
    ...partial,
  }
}

describe('calculatePageScore', () => {
  it('starts at 100 and applies SCORE_WEIGHTS, clamped 0–100', () => {
    expect(SCORE_WEIGHTS).toEqual({ critical: -15, warning: -5, good: 0 })
    expect(calculatePageScore([fakeCheck('title', 'good')])).toBe(100)
    expect(calculatePageScore([fakeCheck('title', 'critical')])).toBe(85)
    expect(calculatePageScore([fakeCheck('title', 'warning')])).toBe(95)
    expect(
      calculatePageScore(Array.from({ length: 20 }, (_, i) => fakeCheck(`c${i}`, 'critical')))
    ).toBe(0)
  })
})

describe('crawlIsDone and coverageFromSession', () => {
  it('is done when the queue is empty or the cap is reached', () => {
    expect(crawlIsDone(session({ queue: [], rawPages: [] }))).toBe(true)
    expect(
      crawlIsDone(
        session({
          queue: ['https://example.com/a'],
          rawPages: Array.from({ length: HOBBY_MAX_PAGES }, () => ({
            url: 'https://example.com/',
            path: '/',
            checks: [],
            outboundLinks: [],
            meta: {
              url: 'https://example.com/',
              path: '/',
              title: '',
              description: '',
              canonical: '',
              h1: '',
            },
          })),
        })
      )
    ).toBe(true)
    expect(
      crawlIsDone(session({ queue: ['https://example.com/a'], rawPages: [] }))
    ).toBe(false)
  })

  it('reports cap only when crawled hits maxPages with work left', () => {
    const pages = Array.from({ length: 3 }, (_, i) => ({
      url: `https://example.com/${i}`,
      path: `/${i}`,
      checks: [fakeCheck('title', 'good')],
      outboundLinks: [],
      meta: {
        url: `https://example.com/${i}`,
        path: `/${i}`,
        title: `Page ${i}`,
        description: `Desc ${i}`,
        canonical: `https://example.com/${i}`,
        h1: `Page ${i}`,
      },
    }))
    expect(
      coverageFromSession(
        session({
          opts: { ...defaultOpts, maxPages: 3 },
          queue: ['https://example.com/more'],
          discovered: ['a', 'b', 'c', 'd'],
          rawPages: pages,
        })
      )
    ).toEqual({ crawled: 3, discovered: 4, cap: 3, stopReason: 'cap' })

    expect(
      coverageFromSession(
        session({
          opts: { ...defaultOpts, maxPages: 50 },
          queue: [],
          discovered: ['a'],
          rawPages: pages.slice(0, 1),
        })
      )
    ).toEqual({ crawled: 1, discovered: 1, cap: 50, stopReason: 'complete' })
  })
})

describe('finalizeReport', () => {
  it('aggregates page + domain checks without inventing a GEO or CWV score', () => {
    const report = finalizeReport(
      session({
        domainChecks: [fakeCheck('robots-txt', 'warning', 'domain')],
        rawPages: [
          {
            url: 'https://example.com/',
            path: '/',
            checks: [
              fakeCheck('title', 'critical'),
              fakeCheck('h1', 'good', 'content'),
            ],
            outboundLinks: ['https://example.com/about'],
            meta: {
              url: 'https://example.com/',
              path: '/',
              title: 'Home',
              description: 'Home description',
              canonical: 'https://example.com/',
              h1: 'Home',
            },
          },
        ],
      })
    )

    expect(report.pagesScanned).toBe(1)
    expect(report.summary.criticalIssues).toBeGreaterThanOrEqual(1)
    expect(report.summary.grade).toMatch(/^[ABCDF]$/)
    expect(report.summary.score).toBeGreaterThanOrEqual(0)
    expect(report.summary.score).toBeLessThanOrEqual(100)
    expect(Object.keys(report.checksByCategory).sort()).toEqual(
      [...CHECK_CATEGORIES].sort()
    )
    expect(JSON.stringify(report)).not.toMatch(/GEO score/i)
    expect(JSON.stringify(report.summary)).not.toMatch(/Core Web Vitals/i)
  })
})

describe('maxPagesForPlan', () => {
  it('is Hobby 50 / Pro 500', () => {
    expect(maxPagesForPlan('pro')).toBe(PRO_MAX_PAGES)
    expect(maxPagesForPlan('hobby')).toBe(HOBBY_MAX_PAGES)
    expect(maxPagesForPlan(null)).toBe(50)
    expect(maxPagesForPlan(undefined)).toBe(50)
    expect(PRO_MAX_PAGES).toBe(500)
  })
})

describe('evaluateLlmsTxt', () => {
  it('present file is still optional and not a ranking lever', () => {
    const result = evaluateLlmsTxt(true)
    expect(result.id).toBe('llms-txt')
    expect(result.status).toBe('good')
    expect(result.message).toMatch(/optional/i)
    expect(`${result.message} ${result.whyItMatters}`).toMatch(
      /ignores|does not use it/i
    )
    expect(result.howToFix).toMatch(/Do not treat this file as a ranking/)
  })
})
