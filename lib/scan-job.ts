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

const TICK_LOCK_MS = 45_000

export type ScanJobStatus = 'running' | 'complete' | 'failed'

export type RunningScanPayload = {
  status: 'running'
  domainInput: string
  crawl: CrawlSession
  lockedAt: number | null
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

export async function createRunningScan(input: {
  userId: string
  domainUrl: string
  maxPages: number
}): Promise<{ id: string; payload: RunningScanPayload }> {
  const crawl = await startCrawl(input.domainUrl, { maxPages: input.maxPages })
  const payload: RunningScanPayload = {
    status: 'running',
    domainInput: input.domainUrl,
    crawl,
    lockedAt: null,
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

export async function processScanTick(reportId: string): Promise<StoredScanPayload> {
  const record = await prisma.domainReport.findUnique({ where: { id: reportId } })
  if (!record || record.status !== 'running') {
    const existing = record ? parseStoredScan(record.reportData) : null
    if (existing) return existing
    throw new Error('Scan is not running')
  }

  const payload = parseStoredScan(record.reportData)
  if (!isRunningPayload(payload)) {
    throw new Error('Scan payload is not running')
  }

  const now = Date.now()
  if (payload.lockedAt && now - payload.lockedAt < TICK_LOCK_MS) {
    return payload
  }

  payload.lockedAt = now
  await prisma.domainReport.update({
    where: { id: reportId },
    data: { reportData: JSON.stringify(payload) },
  })

  try {
    const crawl = await crawlTick(payload.crawl, PAGES_PER_TICK)
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
      progress: coverageFromSession(crawl),
    }
    await prisma.domainReport.update({
      where: { id: reportId },
      data: { reportData: JSON.stringify(next) },
    })
    return next
  } catch (error) {
    const failed: FailedScanPayload = {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Scan failed',
    }
    await prisma.domainReport.update({
      where: { id: reportId },
      data: { status: 'failed', reportData: JSON.stringify(failed) },
    })
    return failed
  }
}
