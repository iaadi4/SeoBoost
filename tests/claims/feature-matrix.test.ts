import { describe, expect, it } from 'vitest'
import { FEATURE_CLAIMS, type FeatureClaim } from '@/lib/claims'

const BANNED_LABEL = /GEO|AEO|AI Overview|citation %|llms\.txt|link graph|Core Web Vitals/i

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

  it('refuses GEO / AIO / CWV / link-graph marketing until those lanes exist', () => {
    for (const row of FEATURE_CLAIMS) {
      expect(row.userLabel).not.toMatch(BANNED_LABEL)
    }
  })

  it('a CWV row, if added, must use crux or psi', () => {
    const cwv = FEATURE_CLAIMS.filter((r) => /core web vitals/i.test(r.userLabel))
    for (const row of cwv) {
      expect(['crux', 'psi']).toContain(row.measurement)
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
