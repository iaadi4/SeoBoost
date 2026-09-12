import { describe, expect, it } from 'vitest'
import { parseSitemapLocs } from '@/lib/sitemap-locs'

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
})
