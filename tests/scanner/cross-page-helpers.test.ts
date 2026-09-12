import { describe, expect, it } from 'vitest'
import { CHECK_IDS } from '@/lib/claims'
import {
  CROSS_PAGE_CHECK_IDS,
  evaluateCrossPageChecks,
  normalizeCanon,
  normText,
  pageMetaFromHtml,
  pathFromUrl,
  resolveCanonical,
} from '@/lib/cross-page'

describe('cross-page helpers', () => {
  it('normalises paths, titles, and canonicals without inventing a graph', () => {
    expect(pathFromUrl('https://example.com/about/')).toBe('/about')
    expect(pathFromUrl('not a url')).toBe('not a url')
    expect(normText('  Hello   world  ')).toBe('Hello world')
    expect(normalizeCanon('http://www.example.com/page/')).toBe(
      'https://example.com/page'
    )
    expect(resolveCanonical('https://example.com/a', '/b')).toBe(
      'https://example.com/b'
    )
  })

  it('reads title / description / canonical / H1 from first HTML', () => {
    const meta = pageMetaFromHtml(
      'https://example.com/about',
      `<!doctype html><html><head>
        <title>About us</title>
        <meta name="description" content="About page" />
        <link rel="canonical" href="https://example.com/about" />
      </head><body><h1>About</h1></body></html>`
    )
    expect(meta).toMatchObject({
      path: '/about',
      title: 'About us',
      description: 'About page',
      canonical: 'https://example.com/about',
      h1: 'About',
    })
  })

  it('emits uniqueness checks that are in CHECK_IDS, never orphans or a GEO score', () => {
    const checks = evaluateCrossPageChecks([
      {
        url: 'https://example.com/a',
        path: '/a',
        title: 'Same title',
        description: 'Same desc',
        canonical: 'https://example.com/a',
        h1: 'Same h1',
      },
      {
        url: 'https://example.com/b',
        path: '/b',
        title: 'Same title',
        description: 'Same desc',
        canonical: 'https://example.com/b',
        h1: 'Same h1',
      },
    ])
    const ids = checks.map((c) => c.id)
    expect(ids.sort()).toEqual([...Object.values(CROSS_PAGE_CHECK_IDS)].sort())
    for (const id of ids) {
      expect(CHECK_IDS).toContain(id)
    }
    expect(ids.some((id) => /orphan|in-?degree/i.test(id))).toBe(false)
    expect(JSON.stringify(checks)).not.toMatch(/GEO score/i)
    expect(checks.find((c) => c.id === 'duplicate-titles')?.status).not.toBe(
      'good'
    )
  })
})
