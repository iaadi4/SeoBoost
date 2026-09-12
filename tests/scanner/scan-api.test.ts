import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScanError } from '@/lib/scanner'

const getUser = vi.fn()
const upsert = vi.fn()
const count = vi.fn()
const createRunningScan = vi.fn()
const processScanTick = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
  })),
}))

vi.mock('@/lib/prisma', () => ({
  default: {
    user: { upsert },
    domainReport: { count, findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}))

vi.mock('@/lib/scan-job', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/scan-job')>()
  return {
    ...actual,
    createRunningScan,
    processScanTick,
  }
})

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    after: (fn: () => void) => {
      void fn()
    },
  }
})

describe('POST /api/scan errors', () => {
  beforeEach(() => {
    getUser.mockReset()
    upsert.mockReset()
    count.mockReset()
    createRunningScan.mockReset()
    processScanTick.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  async function postScan(options: {
    url?: string
    accept?: string
    signedIn?: boolean
  }) {
    const { POST } = await import('@/app/api/scan/route')
    const form = new FormData()
    if (options.url !== undefined) form.set('url', options.url)
    const headers: Record<string, string> = {}
    if (options.accept) headers.Accept = options.accept
    getUser.mockResolvedValue({
      data: {
        user: options.signedIn === false ? null : { id: 'user-1', email: 'a@b.c' },
      },
    })
    return POST(
      new Request('http://localhost/api/scan', {
        method: 'POST',
        headers,
        body: form,
      })
    )
  }

  it('returns JSON 401 when an API client is unauthenticated', async () => {
    const res = await postScan({
      url: 'example.com',
      accept: 'application/json',
      signedIn: false,
    })
    const body = await res.json()
    expect(res.status).toBe(401)
    expect(body.code).toBe('UNAUTHENTICATED')
  })

  it('redirects browser form posts that are unauthenticated', async () => {
    const res = await postScan({ url: 'example.com', signedIn: false })
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/seo-audit-login')
  })

  it('returns JSON 403 when the free scan cap is reached', async () => {
    upsert.mockResolvedValue({ id: 'user-1', subscriptionPlan: 'free' })
    count.mockResolvedValue(3)

    const res = await postScan({
      url: 'example.com',
      accept: 'application/json',
    })
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.code).toBe('SCAN_CAP')
    expect(createRunningScan).not.toHaveBeenCalled()
  })

  it('redirects form posts that hit the free scan cap', async () => {
    upsert.mockResolvedValue({ id: 'user-1', subscriptionPlan: 'free' })
    count.mockResolvedValue(3)

    const res = await postScan({ url: 'example.com' })

    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toContain('/pricing?limit=reached')
  })

  it('returns JSON 400 for an invalid domain', async () => {
    const res = await postScan({
      url: 'not-a-domain',
      accept: 'application/json',
    })
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.code).toBe('DOMAIN_INVALID')
  })

  it('maps ScanError INVALID_URL to DOMAIN_INVALID', async () => {
    upsert.mockResolvedValue({ id: 'user-1', subscriptionPlan: 'pro' })
    createRunningScan.mockRejectedValue(
      new ScanError('Invalid domain or URL: "https://%".', 'INVALID_URL')
    )

    const res = await postScan({
      url: 'https://example.com',
      accept: 'application/json',
    })
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.code).toBe('DOMAIN_INVALID')
    expect(body.error).toMatch(/Invalid domain/)
  })
})
