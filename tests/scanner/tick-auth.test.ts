import { beforeEach, describe, expect, it, vi } from 'vitest'
import { canTickReport } from '@/lib/crawl-limits'

const getUser = vi.fn()
const findUnique = vi.fn()
const processScanTick = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
  })),
}))

vi.mock('@/lib/prisma', () => ({
  default: {
    domainReport: { findUnique },
  },
}))

vi.mock('@/lib/scan-job', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/scan-job')>()
  return {
    ...actual,
    processScanTick,
  }
})

describe('canTickReport', () => {
  it('allows the owner of a running scan', () => {
    expect(
      canTickReport({ userId: 'user-1', status: 'running' }, 'user-1')
    ).toBe(true)
  })

  it('rejects another user and non-running reports', () => {
    expect(
      canTickReport({ userId: 'user-1', status: 'running' }, 'user-2')
    ).toBe(false)
    expect(
      canTickReport({ userId: 'user-1', status: 'complete' }, 'user-1')
    ).toBe(false)
    expect(
      canTickReport({ userId: 'user-1', status: 'failed' }, 'user-1')
    ).toBe(false)
  })
})

describe('POST /api/scan/tick', () => {
  beforeEach(() => {
    getUser.mockReset()
    findUnique.mockReset()
    processScanTick.mockReset()
  })

  async function postTick(id?: string) {
    const { POST } = await import('@/app/api/scan/tick/route')
    return POST(
      new Request('http://localhost/api/scan/tick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { id } : {}),
      })
    )
  }

  it('returns a clear unauthenticated error', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    const res = await postTick('report-1')
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.code).toBe('UNAUTHENTICATED')
    expect(processScanTick).not.toHaveBeenCalled()
  })

  it('rejects a tick from anyone except the report owner', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-2' } } })
    findUnique.mockResolvedValue({
      id: 'report-1',
      userId: 'user-1',
      status: 'running',
    })

    const res = await postTick('report-1')
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.code).toBe('FORBIDDEN')
    expect(processScanTick).not.toHaveBeenCalled()
  })

  it('ticks only when the caller owns the running report', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    findUnique.mockResolvedValue({
      id: 'report-1',
      userId: 'user-1',
      status: 'running',
    })
    processScanTick.mockResolvedValue({
      status: 'running',
      progress: { crawled: 1, discovered: 2, cap: 50, stopReason: 'complete' },
    })

    const res = await postTick('report-1')

    expect(res.status).toBe(200)
    expect(processScanTick).toHaveBeenCalledWith('report-1')
  })
})
