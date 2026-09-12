import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CrawlSession } from '@/lib/scanner'
import type { RunningScanPayload, StoredScanPayload } from '@/lib/scan-job'

const findUnique = vi.fn()
const update = vi.fn()
const crawlTick = vi.fn()
const finalizeReport = vi.fn()

vi.mock('@/lib/prisma', () => ({
  default: {
    domainReport: {
      findUnique,
      update,
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/scanner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/scanner')>()
  return {
    ...actual,
    crawlTick: (...args: unknown[]) => crawlTick(...args),
    finalizeReport: (...args: unknown[]) => finalizeReport(...args),
  }
})

const {
  STALE_SCAN_MS,
  TICK_LOCK_MS,
  holdsTickLock,
  isScanStale,
  isTickLocked,
  parseStoredScan,
  processScanTick,
  scanApiErrorPayload,
} = await import('@/lib/scan-job')

function crawlSession(overrides: Partial<CrawlSession> = {}): CrawlSession {
  return {
    origin: 'https://example.com',
    opts: {
      maxPages: 50,
      fetchTimeoutMs: 10_000,
      stripTrackingParams: true,
      userAgent: 'test',
      revalidate: 0,
      politenessDelayMs: 0,
      fetchRetries: 0,
    },
    queue: ['https://example.com/'],
    queued: ['https://example.com/'],
    visited: [],
    discovered: ['https://example.com/'],
    rawPages: [],
    domainChecks: [],
    robotsDisallowed: [],
    lastFetchAt: 0,
    startedAt: Date.now(),
    ...overrides,
  }
}

function runningPayload(
  overrides: Partial<RunningScanPayload> = {}
): RunningScanPayload {
  const startedAt = overrides.startedAt ?? Date.now()
  return {
    status: 'running',
    domainInput: 'https://example.com',
    crawl: crawlSession({ startedAt }),
    lockedAt: null,
    lockId: null,
    startedAt,
    progress: {
      crawled: 0,
      discovered: 1,
      cap: 50,
      stopReason: 'complete',
    },
    ...overrides,
  }
}

function store(record: {
  id?: string
  status: string
  reportData: string
}) {
  const row = { id: 'report-1', ...record }
  findUnique.mockImplementation(async () => ({ ...row }))
  update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
    Object.assign(row, data)
    return { ...row }
  })
  return row
}

describe('scan job helpers', () => {
  it('keeps the tick lock at 45 seconds', () => {
    expect(TICK_LOCK_MS).toBe(45_000)
    const payload = runningPayload({ lockedAt: Date.now() - 10_000 })
    expect(isTickLocked(payload)).toBe(true)
    expect(isTickLocked(payload, Date.now() + TICK_LOCK_MS)).toBe(false)
  })

  it('treats jobs older than the stale window as abandoned', () => {
    const payload = runningPayload({
      startedAt: Date.now() - STALE_SCAN_MS - 1,
    })
    expect(isScanStale(payload)).toBe(true)
    expect(isScanStale(runningPayload({ startedAt: Date.now() }))).toBe(false)
  })

  it('only treats the current lock id as the owner', () => {
    const payload = runningPayload({ lockId: 'lock-a' })
    expect(holdsTickLock(payload, 'lock-a')).toBe(true)
    expect(holdsTickLock(payload, 'lock-b')).toBe(false)
    expect(holdsTickLock({ status: 'failed', error: 'x' }, 'lock-a')).toBe(false)
  })

  it('returns clear API error codes for cap, auth, and invalid domain', () => {
    expect(scanApiErrorPayload('UNAUTHENTICATED')).toEqual({
      code: 'UNAUTHENTICATED',
      error: 'Sign in to start or continue a scan.',
    })
    expect(scanApiErrorPayload('SCAN_CAP').code).toBe('SCAN_CAP')
    expect(scanApiErrorPayload('DOMAIN_INVALID').error).toMatch(/example\.com/)
  })
})

describe('processScanTick', () => {
  beforeEach(() => {
    findUnique.mockReset()
    update.mockReset()
    crawlTick.mockReset()
    finalizeReport.mockReset()
  })

  it('marks the job failed when crawlTick throws', async () => {
    store({
      status: 'running',
      reportData: JSON.stringify(runningPayload()),
    })
    crawlTick.mockRejectedValue(new Error('origin fetch exploded'))

    const result = await processScanTick('report-1')

    expect(result).toEqual({
      status: 'failed',
      error: 'origin fetch exploded',
    })
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'failed' }),
      })
    )
  })

  it('does not start work while the 45s lock is held', async () => {
    store({
      status: 'running',
      reportData: JSON.stringify(
        runningPayload({ lockedAt: Date.now() - 1_000, lockId: 'held' })
      ),
    })

    const result = await processScanTick('report-1')

    expect(crawlTick).not.toHaveBeenCalled()
    expect(isRunningPayloadResult(result)).toBe(true)
    if (result.status === 'running') {
      expect(result.lockId).toBe('held')
    }
  })

  it('fails a stale running job instead of leaving it running', async () => {
    store({
      status: 'running',
      reportData: JSON.stringify(
        runningPayload({ startedAt: Date.now() - STALE_SCAN_MS - 5_000 })
      ),
    })

    const result = await processScanTick('report-1')

    expect(crawlTick).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      status: 'failed',
      error: expect.stringMatching(/timed out/i),
    })
  })

  it('does not overwrite the job when the lock was taken over', async () => {
    const row = store({
      status: 'running',
      reportData: JSON.stringify(runningPayload()),
    })
    crawlTick.mockImplementation(async (crawl: CrawlSession) => {
      const current = parseStoredScan(row.reportData)
      if (current && current.status === 'running') {
        row.reportData = JSON.stringify({
          ...current,
          lockId: 'other-worker',
        })
      }
      throw new Error('should not fail the stolen job')
    })

    const result = await processScanTick('report-1')

    expect(result.status).toBe('running')
    expect(update.mock.calls.some((call) => call[0]?.data?.status === 'failed')).toBe(
      false
    )
  })

  it('marks corrupt running rows failed', async () => {
    store({
      status: 'running',
      reportData: JSON.stringify({ status: 'complete', summary: { score: 1 } }),
    })

    const result = await processScanTick('report-1')

    expect(result.status).toBe('failed')
    expect(crawlTick).not.toHaveBeenCalled()
  })
})

function isRunningPayloadResult(data: StoredScanPayload): boolean {
  return data.status === 'running'
}
