import { describe, expect, it } from 'vitest'
import {
  extraFindingEntries,
  groupChecks,
  orderedCategories,
  stopReasonLabel,
} from '@/app/dashboard/report/[id]/report-display'
import type { AggregatedCheck } from '@/lib/scanner'

const sample: AggregatedCheck = {
  id: 'title',
  label: 'Title',
  category: 'meta',
  status: 'warning',
  currentValue: 'Too short',
  issueCount: 1,
  totalScanned: 2,
  issueText: 'Title is short',
  whyItMatters: 'Titles feed the SERP.',
  howToFix: 'Write a 50–60 character title.',
}

describe('report display helpers', () => {
  it('labels cap vs complete stop reasons', () => {
    expect(stopReasonLabel('cap')).toMatch(/plan cap/i)
    expect(stopReasonLabel('complete')).toMatch(/under the plan cap/i)
  })

  it('renders extra finding fields from other lanes', () => {
    const extras = extraFindingEntries({
      ...sample,
      evidence: 'Observed in first HTML <title>',
      notes: 'Heuristic — not a GEO score.',
      sources: ['https://developers.google.com/search/docs/appearance/title-link'],
      howToFix: sample.howToFix,
    })
    const keys = extras.map((item) => item.key)
    expect(keys).toContain('evidence')
    expect(keys).toContain('notes')
    expect(keys).toContain('sources')
    expect(keys).not.toContain('howToFix')
  })

  it('keeps unknown categories after the known order', () => {
    const grouped = groupChecks(undefined, [
      sample,
      { ...sample, id: 'new-lane', category: 'experimental' as AggregatedCheck['category'] },
    ])
    expect(orderedCategories(grouped)).toEqual(['meta', 'experimental'])
  })
})
