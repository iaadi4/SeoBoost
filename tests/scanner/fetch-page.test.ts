import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  MAX_REDIRECT_HOPS,
  buildFetchChecks,
  classifyFetchError,
  fetchPage,
  isHtmlResponse,
  isRedirectStatus,
} from '@/lib/fetch-page'

const opts = {
  fetchTimeoutMs: 2_000,
  userAgent: 'SEOScanBot-test',
  revalidate: 0,
  fetchRetries: 0,
}

function mockRes(init: {
  status: number
  url?: string
  body?: string
  headers?: Record<string, string>
}) {
  const headers = new Headers(init.headers)
  if (!headers.has('content-type') && init.status === 200) {
    headers.set('content-type', 'text/html')
  }
  return {
    ok: init.status >= 200 && init.status < 300,
    status: init.status,
    url: init.url ?? 'https://example.com/',
    headers,
    text: async () => init.body ?? '',
  }
}

describe('fetchPage HTTP accounting', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('records a 200 with zero hops', async () => {
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      const url = String(input)
      return mockRes({ status: 200, url, body: '<html><title>Ok</title></html>' })
    })

    const result = await fetchPage('https://example.com/about', opts)
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(200)
    expect(result.redirectHops).toBe(0)
    expect(result.redirectChain).toEqual(['https://example.com/about'])
    expect(result.finalUrl).toBe('https://example.com/about')
    expect(result.html).toContain('<title>Ok</title>')
  })

  it('returns 404 HTML instead of dropping the URL', async () => {
    vi.stubGlobal('fetch', async () =>
      mockRes({
        status: 404,
        url: 'https://example.com/gone',
        body: '<html><title>404</title><h1>404</h1></html>',
        headers: { 'content-type': 'text/html' },
      })
    )

    const result = await fetchPage('https://example.com/gone', opts)
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(404)
    expect(result.html).toContain('404')
    const checks = buildFetchChecks(result)
    expect(checks.find((c) => c.id === 'http-status')?.status).toBe('critical')
    expect(checks.find((c) => c.id === 'http-status')?.value).toBe('404')
  })

  it('follows redirects and records hop count plus chain', async () => {
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === 'https://example.com/old') {
        return mockRes({
          status: 301,
          url,
          headers: { location: 'https://example.com/mid' },
        })
      }
      if (url === 'https://example.com/mid') {
        return mockRes({
          status: 302,
          url,
          headers: { location: '/new' },
        })
      }
      return mockRes({
        status: 200,
        url: 'https://example.com/new',
        body: '<html><title>New</title></html>',
      })
    })

    const result = await fetchPage('https://example.com/old', opts)
    expect(result.status).toBe(200)
    expect(result.redirectHops).toBe(2)
    expect(result.redirectStatuses).toEqual([301, 302])
    expect(result.redirectChain).toEqual([
      'https://example.com/old',
      'https://example.com/mid',
      'https://example.com/new',
    ])
    expect(result.finalUrl).toBe('https://example.com/new')

    const checks = buildFetchChecks(result)
    const chain = checks.find((c) => c.id === 'redirect-chain')
    expect(chain?.value).toBe('2 hops')
    expect(chain?.status).toBe('warning')
    expect(chain?.message).toMatch(/\/old → \/mid → \/new/)
    expect(checks.find((c) => c.id === 'http-status')?.value).toBe('200')
  })

  it('caps redirect hops and records too_many_redirects', async () => {
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      const url = new URL(String(input))
      const n = Number(url.pathname.slice(1) || '0')
      return mockRes({
        status: 301,
        url: url.href,
        headers: { location: `https://example.com/${n + 1}` },
      })
    })

    const result = await fetchPage('https://example.com/0', {
      ...opts,
      maxRedirectHops: 2,
    })
    expect(result.error).toBe('too_many_redirects')
    expect(result.redirectHops).toBe(2)
    expect(result.redirectChain.length).toBeGreaterThanOrEqual(3)
    const checks = buildFetchChecks(result)
    expect(checks.find((c) => c.id === 'fetch-error')?.status).toBe('critical')
    expect(checks.find((c) => c.id === 'redirect-chain')?.value).toMatch(/2 hop/)
  })

  it('detects a redirect loop as too_many_redirects', async () => {
    vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
      const url = String(input)
      const location =
        url === 'https://example.com/a'
          ? 'https://example.com/b'
          : 'https://example.com/a'
      return mockRes({ status: 301, url, headers: { location } })
    })

    const result = await fetchPage('https://example.com/a', opts)
    expect(result.error).toBe('too_many_redirects')
    expect(result.redirectChain).toContain('https://example.com/b')
  })

  it('records timeout as a fetch-error, not a silent null', async () => {
    vi.stubGlobal('fetch', async () => {
      const err = new Error('The operation was aborted due to timeout')
      err.name = 'TimeoutError'
      throw err
    })

    const result = await fetchPage('https://example.com/slow', opts)
    expect(result.error).toBe('timeout')
    expect(result.status).toBe(0)
    expect(result.html).toBe('')
    const checks = buildFetchChecks(result)
    expect(checks.find((c) => c.id === 'fetch-error')?.value).toBe('Timeout')
    expect(checks.find((c) => c.id === 'fetch-error')?.status).toBe('critical')
  })

  it('records network failures as a page-level fetch-error', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('fetch failed')
    })

    const result = await fetchPage('https://example.com/down', opts)
    expect(result.error).toBe('network')
    const checks = buildFetchChecks(result)
    expect(checks.find((c) => c.id === 'fetch-error')?.value).toBe('Network error')
  })

  it('retries 5xx then returns the final status', async () => {
    let calls = 0
    vi.stubGlobal('fetch', async () => {
      calls += 1
      if (calls < 3) return mockRes({ status: 503, body: 'busy' })
      return mockRes({ status: 200, body: '<html>ok</html>' })
    })

    const result = await fetchPage('https://example.com/flaky', {
      ...opts,
      fetchRetries: 2,
    })
    expect(calls).toBe(3)
    expect(result.status).toBe(200)
    expect(result.error).toBeUndefined()
  })

  it('does not retry 4xx', async () => {
    let calls = 0
    vi.stubGlobal('fetch', async () => {
      calls += 1
      return mockRes({ status: 404, body: 'missing' })
    })

    const result = await fetchPage('https://example.com/missing', {
      ...opts,
      fetchRetries: 2,
    })
    expect(calls).toBe(1)
    expect(result.status).toBe(404)
  })
})

describe('fetch helpers', () => {
  it('classifies abort/timeout names', () => {
    expect(classifyFetchError(Object.assign(new Error('x'), { name: 'TimeoutError' }))).toBe(
      'timeout'
    )
    expect(classifyFetchError(Object.assign(new Error('x'), { name: 'AbortError' }))).toBe(
      'timeout'
    )
    expect(classifyFetchError(new TypeError('fetch failed'))).toBe('network')
  })

  it('treats 3xx hop codes as redirects', () => {
    expect(isRedirectStatus(301)).toBe(true)
    expect(isRedirectStatus(308)).toBe(true)
    expect(isRedirectStatus(304)).toBe(false)
    expect(isRedirectStatus(200)).toBe(false)
  })

  it('sniffs HTML when content-type is missing', () => {
    expect(isHtmlResponse(undefined, '<!DOCTYPE html><p>Hi</p>')).toBe(true)
    expect(isHtmlResponse('application/json', '{"a":1}')).toBe(false)
    expect(isHtmlResponse('text/html; charset=utf-8', '')).toBe(true)
  })

  it('caps hops at MAX_REDIRECT_HOPS by default', () => {
    expect(MAX_REDIRECT_HOPS).toBe(8)
  })
})
