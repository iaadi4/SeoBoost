import { afterEach, describe, expect, it, vi } from 'vitest'
import { scanDomain } from '@/lib/scanner'

function pageHtml(title: string, hrefs: string[]) {
  return `<!DOCTYPE html><html lang="en"><head>
<title>${title} Technical SEO Fixture Page</title>
<link rel="canonical" href="https://example.com/${title}" />
</head><body>
<h1>${title}</h1>
<p>Fixture body copy so first-HTML extractability has enough text on this page.</p>
${hrefs.map((href) => `<a href="${href}">${href}</a>`).join('\n')}
</body></html>`
}

const sitemap = `<?xml version="1.0"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/a</loc></url>
  <url><loc>https://example.com/b</loc></url>
  <url><loc>https://example.com/c</loc></url>
</urlset>`

const pages: Record<string, string> = {
  'https://example.com/': pageHtml('home', ['/a', '/d']),
  'https://example.com/a': pageHtml('a', ['/b']),
  'https://example.com/b': pageHtml('b', []),
  'https://example.com/c': pageHtml('c', []),
  'https://example.com/d': pageHtml('d', []),
  'https://example.com/sitemap.xml': sitemap,
}

function mockResponse(url: string, body: string | null) {
  if (body == null) {
    return {
      ok: false,
      status: 404,
      url,
      text: async () => '',
      headers: { forEach: () => undefined },
    }
  }
  const type = url.endsWith('.xml') ? 'application/xml' : 'text/html'
  return {
    ok: true,
    status: 200,
    url,
    text: async () => body,
    headers: {
      forEach: (cb: (value: string, key: string) => void) => {
        cb(type, 'content-type')
      },
    },
  }
}

describe('scanDomain cap and sitemap seed', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('stops at maxPages and reports cap when more URLs remain', async () => {
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      const key = url.split('?')[0]
      if (key in pages) return mockResponse(key, pages[key])
      return mockResponse(key, null)
    })

    const report = await scanDomain('https://example.com', { maxPages: 3 })
    expect(report.pagesScanned).toBe(3)
    expect(report.coverage).toBeDefined()
    expect(report.coverage?.cap).toBe(3)
    expect(report.coverage?.stopReason).toBe('cap')
    expect(report.coverage?.discovered).toBeGreaterThan(3)
    const paths = report.pageAnalysis.map((p) => p.path).sort()
    expect(paths).toContain('/')
    expect(paths.some((p) => p === '/a' || p === '/b' || p === '/c')).toBe(true)
  })
})
