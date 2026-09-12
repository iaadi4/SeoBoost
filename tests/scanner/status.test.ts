import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildFetchChecks, detectSoft404 } from '@/lib/fetch-page'
import { crawlTick, runDomainChecks, startCrawl } from '@/lib/scanner'

function pageHtml(title: string, body: string, hrefs: string[] = []) {
  return `<!DOCTYPE html><html lang="en"><head>
<title>${title}</title>
<link rel="canonical" href="https://example.com/" />
</head><body>
<h1>${title}</h1>
${body}
${hrefs.map((href) => `<a href="${href}">${href}</a>`).join('\n')}
</body></html>`
}

const livePage = pageHtml(
  'Home Technical SEO Fixture Page',
  '<p>Fixture body copy so first-HTML extractability has enough text on this page for a real document.</p>',
  ['/missing']
)

const soft404Html = `<!DOCTYPE html><html lang="en"><head>
<title>Page Not Found</title>
</head><body>
<h1>Page Not Found</h1>
<p>Sorry, we could not find that page.</p>
</body></html>`

function mockResponse(url: string, init: { status: number; body: string | null; type?: string }) {
  if (init.body == null && init.status >= 400) {
    const headers = new Headers()
    return {
      ok: false,
      status: init.status,
      url,
      text: async () => '',
      headers,
    }
  }
  const type = init.type ?? (url.endsWith('.xml') ? 'application/xml' : 'text/html')
  const headers = new Headers({ 'content-type': type })
  return {
    ok: init.status >= 200 && init.status < 300,
    status: init.status,
    url,
    text: async () => init.body ?? '',
    headers,
  }
}

describe('detectSoft404', () => {
  it('flags 200 + thin boilerplate not-found HTML', () => {
    expect(detectSoft404(soft404Html, 200)).toBe(true)
    const checks = buildFetchChecks({
      html: soft404Html,
      headers: { 'content-type': 'text/html' },
      status: 200,
      finalUrl: 'https://example.com/missing',
      requestedUrl: 'https://example.com/missing',
      redirectHops: 0,
      redirectChain: ['https://example.com/missing'],
      redirectStatuses: [],
    })
    expect(checks.find((c) => c.id === 'soft-404')?.status).toBe('warning')
  })

  it('does not flag a real short page without a not-found heading', () => {
    const html = pageHtml(
      'About',
      '<p>We design quiet tools for small teams.</p><p>Based in Lisbon.</p>'
    )
    expect(detectSoft404(html, 200)).toBe(false)
  })

  it('does not flag a long article that mentions 404 in the title', () => {
    const paras = Array.from({ length: 20 }, (_, i) =>
      `<p>Paragraph ${i} explains how to fix 404 page not found errors with redirects and sitemaps in production.</p>`
    ).join('')
    const html = pageHtml('How to Fix 404 Page Not Found Errors in Production', paras)
    expect(detectSoft404(html, 200)).toBe(false)
  })

  it('does not flag a true 404 status as a soft 404', () => {
    expect(detectSoft404(soft404Html, 404)).toBe(false)
  })
})

describe('crawlTick fetch findings', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('records a 404 URL as a page with http-status instead of dropping it', async () => {
    const bodies: Record<string, { status: number; body: string | null }> = {
      'https://example.com/': { status: 200, body: livePage },
      'https://example.com/sitemap.xml': { status: 404, body: null },
      'https://example.com/robots.txt': { status: 404, body: null },
      'https://example.com/missing': {
        status: 404,
        body: '<!DOCTYPE html><html><head><title>404</title></head><body><h1>404</h1><p>Gone.</p></body></html>',
      },
    }

    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      const url = String(input).split('?')[0]
      const hit = bodies[url]
      if (hit) return mockResponse(url, hit)
      return mockResponse(url, { status: 404, body: null })
    })

    const session = await startCrawl('https://example.com', {
      maxPages: 5,
      fetchRetries: 0,
      politenessDelayMs: 0,
    })
    await crawlTick(session, 5)

    const missing = session.rawPages.find((p) => p.path === '/missing')
    expect(missing).toBeDefined()
    const status = missing!.checks.find((c) => c.id === 'http-status')
    expect(status?.value).toBe('404')
    expect(status?.status).toBe('critical')
    expect(status?.whyItMatters).not.toMatch(/Core Web Vital|LCP|INP|CLS/i)
  })

  it('records timeouts as page-level issues', async () => {
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      const url = String(input).split('?')[0]
      if (url.endsWith('/robots.txt') || url.endsWith('/llms.txt') || url.includes('sitemap')) {
        return mockResponse(url, { status: 404, body: null })
      }
      const err = new Error('The operation was aborted due to timeout')
      err.name = 'TimeoutError'
      throw err
    })

    const session = await startCrawl('https://example.com', {
      maxPages: 2,
      fetchRetries: 0,
      politenessDelayMs: 0,
    })
    await crawlTick(session, 2)

    expect(session.rawPages.length).toBeGreaterThanOrEqual(1)
    const home = session.rawPages[0]
    expect(home.checks.find((c) => c.id === 'fetch-error')?.value).toBe('Timeout')
    expect(home.checks.find((c) => c.id === 'fetch-error')?.status).toBe('critical')
  })

  it('keeps robots.txt 404 as a domain miss, not a crawled HTML page', async () => {
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      const url = String(input).split('?')[0]
      if (url === 'https://example.com/' || url === 'https://example.com') {
        return mockResponse(url, { status: 200, body: livePage })
      }
      return mockResponse(url, { status: 404, body: null })
    })

    const { checks } = await runDomainChecks('https://example.com', {
      maxPages: 5,
      fetchTimeoutMs: 2_000,
      stripTrackingParams: true,
      userAgent: 'test',
      revalidate: 0,
      politenessDelayMs: 0,
      fetchRetries: 0,
    })
    expect(checks.find((c) => c.id === 'robots-txt')?.status).toBe('warning')
    expect(checks.find((c) => c.id === 'robots-txt')?.value).toBe('Missing')
  })

  it('records hop count on a crawled page after a 301', async () => {
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      const url = String(input).split('?')[0]
      if (url === 'https://example.com/' || url === 'https://example.com') {
        return {
          ok: false,
          status: 301,
          url,
          text: async () => '',
          headers: new Headers({ location: 'https://example.com/home' }),
        }
      }
      if (url === 'https://example.com/home') {
        return mockResponse(url, { status: 200, body: livePage })
      }
      return mockResponse(url, { status: 404, body: null })
    })

    const session = await startCrawl('https://example.com', {
      maxPages: 3,
      fetchRetries: 0,
      politenessDelayMs: 0,
    })
    await crawlTick(session, 3)

    const page = session.rawPages.find((p) =>
      p.checks.some((c) => c.id === 'redirect-chain' && c.value !== '0 hops')
    )
    expect(page).toBeDefined()
    const hops = page!.checks.find((c) => c.id === 'redirect-chain')
    expect(hops?.value).toBe('1 hop')
    expect(page!.checks.find((c) => c.id === 'http-status')?.value).toBe('200')
  })
})
