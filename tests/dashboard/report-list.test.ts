import { describe, expect, it } from 'vitest'
import {
  coverageLabel,
  gradeFromScore,
  toReportListItem,
} from '@/app/dashboard/report-list-data'

describe('toReportListItem', () => {
  it('does not treat a running score 0 as a grade', () => {
    const item = toReportListItem({
      id: 'run-1',
      domainUrl: 'https://example.com',
      score: 0,
      status: 'running',
      reportData: JSON.stringify({
        status: 'running',
        domainInput: 'https://example.com',
        progress: { crawled: 12, discovered: 40, cap: 50, stopReason: 'complete' },
      }),
      createdAt: new Date('2026-09-12T10:00:00.000Z'),
    })

    expect(item.status).toBe('running')
    expect(item.score).toBeNull()
    expect(item.grade).toBeNull()
    expect(item.crawled).toBe(12)
    expect(item.cap).toBe(50)
  })

  it('surfaces failed scans without a grade', () => {
    const item = toReportListItem({
      id: 'fail-1',
      domainUrl: 'https://example.com',
      score: 0,
      status: 'failed',
      reportData: JSON.stringify({ status: 'failed', error: 'Timed out' }),
      createdAt: new Date('2026-09-12T10:00:00.000Z'),
    })

    expect(item.status).toBe('failed')
    expect(item.grade).toBeNull()
    expect(item.score).toBeNull()
    expect(item.error).toBe('Timed out')
  })

  it('keeps a real complete grade and coverage', () => {
    const item = toReportListItem({
      id: 'done-1',
      domainUrl: 'https://example.com',
      score: 78,
      status: 'complete',
      reportData: JSON.stringify({
        status: 'complete',
        summary: { score: 78, grade: 'B' },
        coverage: { crawled: 50, discovered: 80, cap: 50, stopReason: 'cap' },
      }),
      createdAt: new Date('2026-09-12T10:00:00.000Z'),
    })

    expect(item.status).toBe('complete')
    expect(item.grade).toBe('B')
    expect(item.score).toBe(78)
    expect(item.crawled).toBe(50)
    expect(item.cap).toBe(50)
    expect(coverageLabel(item.crawled, item.cap)).toBe('50/50')
  })

  it('maps a finished score to an A–F grade', () => {
    expect(gradeFromScore(92)).toBe('A')
    expect(gradeFromScore(78)).toBe('B')
    expect(gradeFromScore(12)).toBe('F')
  })
})
