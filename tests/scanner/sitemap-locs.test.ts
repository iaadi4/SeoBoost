import { describe, expect, it } from 'vitest'
import {
  extractLocs,
  filterSameOriginHtmlLocs,
  isSitemapIndex,
  parseSitemapKind,
  parseSitemapLocs,
} from '@/lib/sitemap-locs'

const urlset = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/a</loc></url>
  <url><loc>https://example.com/b</loc></url>
  <url><loc>https://other.com/x</loc></url>
  <url><loc>https://example.com/file.pdf</loc></url>
</urlset>`

const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-pages.xml</loc></sitemap>
  <sitemap><loc>https://cdn.example.net/extra.xml</loc></sitemap>
</sitemapindex>`

describe('parseSitemapLocs', () => {
  it('keeps same-origin HTML locs and drops off-origin plus assets', () => {
    const parsed = parseSitemapLocs(urlset, 'https://example.com')
    expect(parsed.kind).toBe('urlset')
    expect(parsed.locs).toEqual([
      'https://example.com/a',
      'https://example.com/b',
    ])
  })

  it('returns child sitemap locs for an index without filtering them as pages', () => {
    const parsed = parseSitemapLocs(index, 'https://example.com')
    expect(parsed.kind).toBe('index')
    expect(parsed.locs).toContain('https://example.com/sitemap-pages.xml')
    expect(parsed.locs).toContain('https://cdn.example.net/extra.xml')
  })

  it('extractLocs decodes entities and drops duplicates', () => {
    const xml = `<urlset>
      <url><loc>https://example.com/a&amp;b</loc></url>
      <url><loc>https://example.com/a&amp;b</loc></url>
      <url><loc>  https://example.com/c  </loc></url>
    </urlset>`
    expect(extractLocs(xml)).toEqual([
      'https://example.com/a&b',
      'https://example.com/c',
    ])
  })

  it('filterSameOriginHtmlLocs keeps www-equivalent HTML and drops junk', () => {
    const locs = filterSameOriginHtmlLocs(
      [
        'https://www.example.com/about/',
        'https://example.com/about',
        'https://other.com/x',
        'https://example.com/file.xml',
        'https://example.com/app.js',
      ],
      'https://example.com'
    )
    expect(locs).toEqual(['https://example.com/about'])
  })

  it('classifies sitemap kinds', () => {
    expect(isSitemapIndex(index)).toBe(true)
    expect(parseSitemapKind(index)).toBe('index')
    expect(parseSitemapKind(urlset)).toBe('urlset')
    expect(parseSitemapKind('<html></html>')).toBe('unknown')
    expect(parseSitemapLocs('<html></html>', 'https://example.com')).toEqual({
      kind: 'unknown',
      locs: [],
    })
  })
})
