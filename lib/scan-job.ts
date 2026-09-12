import prisma from '@/lib/prisma'
import {
  coverageFromSession,
  crawlIsDone,
  crawlTick,
  finalizeReport,
  startCrawl,
  type CrawlSession,
  type SEOReport,
} from '@/lib/scanner'
import { PAGES_PER_TICK } from '@/lib/crawl-limits'

export { canTickReport } from '@/lib/crawl-limits'

/** Prevents overlapping ticks. Shorter than route maxDuration (60s); ownership is checked before commit. */
export const TICK_LOCK_MS = 45_000

/** Abandoned `running` jobs fail on the next tick instead of staying running forever. */
export const STALE_SCAN_MS = 30 * 60_000

export type ScanJobStatus = 'running' | 'complete' | 'failed'

export type ScanApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'SCAN_CAP'
  | 'DOMAIN_INVALID'
  | 'URL_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'REPORT_ID_REQUIRED'
  | 'SCAN_FAILED'

export const SCAN_API_ERROR_MESSAGES: Record<ScanApiErrorCode, string> = {
  UNAUTHENTICATED: 'Sign in to start or continue a scan.',
  SCAN_CAP: 'Free plan is limited to 3 scans. Upgrade to Pro for unlimited scans.',
  DOMAIN_INVALID:
    'Enter a valid domain or URL, like example.com or https://example.com.',
  URL_REQUIRED: 'A website URL is required.',
  FORBIDDEN: 'Only the report owner can continue this scan.',
  NOT_FOUND: 'Scan report not found.',
  REPORT_ID_REQUIRED: 'Report id is required.',
  SCAN_FAILED: 'Scan failed. Please try again later.',
}

export function scanApiErrorPayload(
  code: ScanApiErrorCode,
  message?: string
): { error: string; code: ScanApiErrorCode } {
  return { error: message ?? SCAN_API_ERROR_MESSAGES[code], code }
}

export type RunningScanPayload = {
  status: 'running'
  domainInput: string
  crawl: CrawlSession
  lockedAt: number | null
  lockId?: string | null
  startedAt?: number
  progress: ReturnType<typeof coverageFromSession>
}

export type FailedScanPayload = {
  status: 'failed'
  error: string
}

export type CompleteScanPayload = SEOReport & { status: 'complete' }

export type StoredScanPayload =
  | RunningScanPayload
  | FailedScanPayload
  | CompleteScanPayload

export function parseStoredScan(raw: string): StoredScanPayload | null {
  try {
    const data = JSON.parse(raw) as StoredScanPayload
    if (!data || typeof data !== 'object' || !('status' in data)) return null
    return data
  } catch {
    return null
  }
}

export function isRunningPayload(
  data: StoredScanPayload | null
): data is RunningScanPayload {
  return data?.status === 'running'
}

export function scanStartedAt(payload: RunningScanPayload): number {
  return payload.startedAt ?? payload.crawl?.startedAt ?? 0
}

export function isTickLocked(payload: RunningScanPayload, now = Date.now()): boolean {
  return payload.lockedAt != null && now - payload.lockedAt < TICK_LOCK_MS
}

export function isScanStale(payload: RunningScanPayload, now = Date.now()): boolean {
  return now - scanStartedAt(payload) > STALE_SCAN_MS
}

export function holdsTickLock(
  payload: StoredScanPayload | null,
  lockId: string
): payload is RunningScanPayload {
  return isRunningPayload(payload) && payload.lockId === lockId
}

export async function createRunningScan(input: {
  userId: string
  domainUrl: string
  maxPages: number
}): Promise<{ id: string; payload: RunningScanPayload }> {
  const crawl = await startCrawl(input.domainUrl, { maxPages: input.maxPages })
  const startedAt = Date.now()
  const payload: RunningScanPayload = {
    status: 'running',
    domainInput: input.domainUrl,
    crawl,
    lockedAt: null,
    lockId: null,
    startedAt,
    progress: coverageFromSession(crawl),
  }
  const saved = await prisma.domainReport.create({
    data: {
      userId: input.userId,
      domainUrl: input.domainUrl,
      score: 0,
      status: 'running',
      reportData: JSON.stringify(payload),
    },
  })
  return { id: saved.id, payload }
}

async function markScanFailed(
  reportId: string,
  error: string
): Promise<FailedScanPayload> {
  const failed: FailedScanPayload = { status: 'failed', error }
  await prisma.domainReport.update({
    where: { id: reportId },
    data: { status: 'failed', reportData: JSON.stringify(failed) },
  })
  return failed
}

async function readStoredScan(reportId: string): Promise<{
  status: string
  payload: StoredScanPayload | null
} | null> {
  const record = await prisma.domainReport.findUnique({ where: { id: reportId } })
  if (!record) return null
  return { status: record.status, payload: parseStoredScan(record.reportData) }
}

export async function processScanTick(reportId: string): Promise<StoredScanPayload> {
  const record = await prisma.domainReport.findUnique({ where: { id: reportId } })
  if (!record) {
    return { status: 'failed', error: 'Scan is not running' }
  }
  if (record.status !== 'running') {
    const existing = parseStoredScan(record.reportData)
    if (existing) return existing
    return { status: 'failed', error: 'Scan is not running' }
  }

  const payload = parseStoredScan(record.reportData)
  if (!isRunningPayload(payload)) {
    return markScanFailed(reportId, 'Scan payload is not running')
  }

  const now = Date.now()
  if (isTickLocked(payload, now)) {
    return payload
  }

  if (isScanStale(payload, now)) {
    return markScanFailed(
      reportId,
      'Scan timed out before it finished. Start a new scan.'
    )
  }

  const lockId = crypto.randomUUID()
  const locked: RunningScanPayload = {
    ...payload,
    lockedAt: now,
    lockId,
    startedAt: scanStartedAt(payload),
  }
  await prisma.domainReport.update({
    where: { id: reportId },
    data: { reportData: JSON.stringify(locked) },
  })

  try {
    const crawl = await crawlTick(payload.crawl, PAGES_PER_TICK)
    const latest = await readStoredScan(reportId)
    if (!holdsTickLock(latest?.payload ?? null, lockId)) {
      return latest?.payload ?? locked
    }

    if (crawlIsDone(crawl)) {
      const report = finalizeReport(crawl)
      const complete: CompleteScanPayload = { ...report, status: 'complete' }
      await prisma.domainReport.update({
        where: { id: reportId },
        data: {
          status: 'complete',
          score: report.summary.score,
          reportData: JSON.stringify(complete),
        },
      })
      return complete
    }

    const next: RunningScanPayload = {
      status: 'running',
      domainInput: payload.domainInput,
      crawl,
      lockedAt: null,
      lockId: null,
      startedAt: scanStartedAt(payload),
      progress: coverageFromSession(crawl),
    }
    await prisma.domainReport.update({
      where: { id: reportId },
      data: { reportData: JSON.stringify(next) },
    })
    return next
  } catch (error) {
    const latest = await readStoredScan(reportId)
    if (!holdsTickLock(latest?.payload ?? null, lockId)) {
      return latest?.payload ?? locked
    }
    return markScanFailed(
      reportId,
      error instanceof Error ? error.message : 'Scan failed'
    )
  }
}
