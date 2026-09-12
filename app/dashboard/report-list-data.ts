export const FREE_SCAN_LIMIT = 3

export type ReportStatus = 'running' | 'complete' | 'failed'
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F'

export type ReportListItem = {
  id: string
  domainUrl: string
  createdAt: string
  status: ReportStatus
  score: number | null
  grade: Grade | null
  crawled: number | null
  cap: number | null
  error: string | null
}

const GRADES: Grade[] = ['A', 'B', 'C', 'D', 'F']

type ListPayload = {
  status?: string
  error?: string
  pagesScanned?: number
  progress?: { crawled?: number; cap?: number }
  coverage?: { crawled?: number; cap?: number }
  summary?: { score?: number; grade?: unknown }
}

export function gradeFromScore(score: number): Grade {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 45) return 'D'
  return 'F'
}

export function gradeTone(grade: Grade): string {
  if (grade === 'A' || grade === 'B') return '#3d6b4f'
  if (grade === 'C' || grade === 'D') return '#c47a4a'
  return '#b42318'
}

export function hostnameFromUrl(raw: string): string {
  try {
    return new URL(raw).hostname
  } catch {
    return raw
  }
}

export function hobbyScansRemaining(totalScans: number): number {
  return Math.max(0, FREE_SCAN_LIMIT - totalScans)
}

export function coverageLabel(
  crawled: number | null,
  cap: number | null
): string {
  if (crawled != null && cap != null) return `${crawled}/${cap}`
  if (crawled != null) return `${crawled} pages`
  return '—'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readGrade(value: unknown): Grade | null {
  return typeof value === 'string' && GRADES.includes(value as Grade)
    ? (value as Grade)
    : null
}

function parseListPayload(raw: string): ListPayload | null {
  try {
    const data = JSON.parse(raw) as unknown
    return isRecord(data) ? (data as ListPayload) : null
  } catch {
    return null
  }
}

export function toReportListItem(r: {
  id: string
  domainUrl: string
  score: number
  status: string
  reportData: string
  createdAt: Date
}): ReportListItem {
  const stored = parseListPayload(r.reportData)
  const failed = r.status === 'failed' || stored?.status === 'failed'
  const running = r.status === 'running' && !failed

  if (running) {
    return {
      id: r.id,
      domainUrl: r.domainUrl,
      createdAt: r.createdAt.toISOString(),
      status: 'running',
      score: null,
      grade: null,
      crawled:
        typeof stored?.progress?.crawled === 'number'
          ? stored.progress.crawled
          : null,
      cap: typeof stored?.progress?.cap === 'number' ? stored.progress.cap : null,
      error: null,
    }
  }

  if (failed) {
    return {
      id: r.id,
      domainUrl: r.domainUrl,
      createdAt: r.createdAt.toISOString(),
      status: 'failed',
      score: null,
      grade: null,
      crawled: null,
      cap: null,
      error:
        typeof stored?.error === 'string' ? stored.error : 'The scan failed.',
    }
  }

  let crawled: number | null = null
  let cap: number | null = null
  let grade: Grade | null = null
  let score: number | null = typeof r.score === 'number' ? r.score : null

  if (typeof stored?.coverage?.crawled === 'number') {
    crawled = stored.coverage.crawled
  } else if (typeof stored?.pagesScanned === 'number') {
    crawled = stored.pagesScanned
  }
  if (typeof stored?.coverage?.cap === 'number') cap = stored.coverage.cap
  if (typeof stored?.summary?.score === 'number') score = stored.summary.score
  grade = readGrade(stored?.summary?.grade)
  if (!grade && score != null) grade = gradeFromScore(score)

  return {
    id: r.id,
    domainUrl: r.domainUrl,
    createdAt: r.createdAt.toISOString(),
    status: 'complete',
    score,
    grade,
    crawled,
    cap,
    error: null,
  }
}

export function formatReportDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
