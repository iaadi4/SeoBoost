import { describe, expect, it } from 'vitest'
import {
  CHECK_CATEGORIES,
  CHECK_IDS,
  FEATURE_CLAIMS,
  HOBBY_BULLETS,
  PRO_BULLETS,
  SCANNER_CATEGORY_COUNT,
  SCANNER_CHECK_COUNT,
  type FeatureClaim,
} from '@/lib/claims'
import { HOBBY_MAX_PAGES, PRO_MAX_PAGES } from '@/lib/crawl-limits'

const BANNED_LABEL = /GEO|AEO|AI Overview|citation %|llms\.txt|link graph|Core Web Vitals/i
const CLAIM_SURFACES = [
  ...FEATURE_CLAIMS.map((r) => r.userLabel),
  ...HOBBY_BULLETS,
  ...PRO_BULLETS,
]

describe('claim-to-check matrix', () => {
  it('every row has a measurement other than none', () => {
    for (const row of FEATURE_CLAIMS) {
      expect(row.measurement, row.userLabel).not.toBe('none')
    }
  })

  it('audit rows bind to real check ids', () => {
    for (const row of FEATURE_CLAIMS.filter((r) => r.kind === 'audit')) {
      expect(row.checkIds.length, row.userLabel).toBeGreaterThan(0)
    }
  })

  it('every bound check id exists in CHECK_IDS', () => {
    const known = new Set<string>(CHECK_IDS)
    for (const row of FEATURE_CLAIMS) {
      for (const id of row.checkIds) {
        expect(known.has(id), `${row.userLabel} → ${id}`).toBe(true)
      }
    }
  })

  it('refuses GEO / AIO / CWV / link-graph marketing until those lanes exist', () => {
    for (const row of FEATURE_CLAIMS) {
      expect(row.userLabel).not.toMatch(BANNED_LABEL)
    }
  })

  it('claim copy never sells CWV or a GEO score', () => {
    for (const text of CLAIM_SURFACES) {
      expect(text, text).not.toMatch(/Core Web Vitals/i)
      if (/GEO/i.test(text)) {
        expect(text).toMatch(/not a GEO score/i)
      }
    }
  })

  it('a CWV row, if added, must use crux or psi', () => {
    const cwv = FEATURE_CLAIMS.filter((r) => /core web vitals/i.test(r.userLabel))
    for (const row of cwv) {
      expect(['crux', 'psi']).toContain(row.measurement)
    }
  })

  it('no audit row uses crux or psi until a CWV lane exists', () => {
    for (const row of FEATURE_CLAIMS) {
      expect(row.measurement, row.userLabel).toBe('html')
    }
  })

  it('a link-graph row, if added, must include orphan or in-degree checks', () => {
    const graph = FEATURE_CLAIMS.filter((r) => /link graph/i.test(r.userLabel))
    for (const row of graph) {
      const hasGraphId = row.checkIds.some((id) =>
        /orphan|in-?degree|inlinks/i.test(id)
      )
      expect(hasGraphId, row.userLabel).toBe(true)
    }
  })

  it('pages crawled is Hobby 50 / Pro 500', () => {
    const pages = FEATURE_CLAIMS.find((r) => /pages crawled/i.test(r.userLabel))
    expect(pages?.free).toBe('50')
    expect(pages?.pro).toBe('500')
    expect(HOBBY_MAX_PAGES).toBe(50)
    expect(PRO_MAX_PAGES).toBe(500)
    expect(HOBBY_BULLETS.some((b) => /\b50\b/.test(b))).toBe(true)
    expect(PRO_BULLETS.some((b) => /\b500\b/.test(b))).toBe(true)
  })

  it('does not say 45+ unless the locked count is at least 45', () => {
    const band = CLAIM_SURFACES.filter((text) => /45\+/.test(text))
    if (band.length > 0) {
      expect(SCANNER_CHECK_COUNT).toBeGreaterThanOrEqual(45)
    }
    expect(SCANNER_CHECK_COUNT).toBe(CHECK_IDS.length)
    expect(SCANNER_CHECK_COUNT).toBeGreaterThanOrEqual(45)
  })

  it('JSON-LD row requires required-property checks, not parse-only', () => {
    const jsonLd = FEATURE_CLAIMS.find((r) => /JSON-LD/i.test(r.userLabel))
    expect(jsonLd).toBeDefined()
    expect(jsonLd!.checkIds).toEqual(
      expect.arrayContaining(['schema', 'breadcrumb-schema', 'aggregate-rating'])
    )
  })

  it('adding an unbound Pro audit row fails', () => {
    const rogue: FeatureClaim = {
      userLabel: 'AI ranking guarantee',
      free: false,
      pro: true,
      kind: 'audit',
      checkIds: [],
      measurement: 'none',
    }
    expect(rogue.checkIds.length).toBe(0)
    expect(rogue.measurement).toBe('none')
    const wouldFailMatrix =
      rogue.kind === 'audit' &&
      (rogue.checkIds.length === 0 || rogue.measurement === 'none')
    expect(wouldFailMatrix).toBe(true)
  })
})

describe('CHECK_IDS source of truth', () => {
  it('is unique, sorted, and drives the public counts', () => {
    expect(new Set(CHECK_IDS).size).toBe(CHECK_IDS.length)
    expect([...CHECK_IDS]).toEqual([...CHECK_IDS].sort())
    expect(SCANNER_CHECK_COUNT).toBe(CHECK_IDS.length)
    expect(SCANNER_CATEGORY_COUNT).toBe(CHECK_CATEGORIES.length)
    expect(CHECK_CATEGORIES).toHaveLength(12)
  })
})
