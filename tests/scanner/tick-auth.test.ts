import { describe, expect, it } from 'vitest'
import { canTickReport } from '@/lib/crawl-limits'

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
  })
})
