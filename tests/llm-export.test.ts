import { describe, expect, it } from 'vitest'
import { SCANNER_CHECK_COUNT } from '@/lib/claims'
import {
  buildEditorFixPrompt,
  findingsFromAggregated,
  LLM_EXPORT_DENY,
  LLM_EXPORT_DO_NOT,
  LLM_EXPORT_SCOPE,
  publicAuditSiteUrl,
  sanitizeAuditText,
} from '@/lib/llm-export'

describe('sanitizeAuditText', () => {
  it('strips every deny-list phrase from dirty copy', () => {
    const dirty = [
      'Add llms.txt and llms-full.txt.',
      'FAQ schema can generate expandable Q&A boxes.',
      'GEO score 88. AEO score 12.',
      'citation probability 40% and citation percentage 12 and citation % 9.',
      'Disallow Googlebot to opt out of AI Overviews.',
      'This page is eligible for FAQ rich results.',
    ].join(' ')
    const clean = sanitizeAuditText(dirty)
    for (const banned of LLM_EXPORT_DENY) {
      expect(clean.toLowerCase()).not.toContain(banned.toLowerCase())
    }
  })
})

describe('buildEditorFixPrompt', () => {
  const findings = findingsFromAggregated([
    {
      id: 'ai-snippet-eligible',
      label: 'AI snippet eligibility',
      status: 'warning',
      issueText: 'nosnippet withholds AI Overview input. GEO score 10. citation % 4.',
      howToFix: 'Remove nosnippet from public pages. Do not add llms.txt for Google.',
      worstPage: '/pricing',
      currentValue: 'nosnippet',
    },
    {
      id: 'title',
      label: 'Title Tag',
      status: 'good',
      issueText: 'Fine',
      howToFix: '',
    },
  ])

  const prompt = buildEditorFixPrompt({
    siteUrl: 'https://example.com/pricing',
    score: 72,
    grade: 'C',
    pagesCrawled: 12,
    pageCap: 50,
    findings,
  })

  it('states first HTML, 50/500, and 48+ checks', () => {
    expect(prompt).toMatch(/first-HTML/i)
    expect(LLM_EXPORT_SCOPE).toMatch(/50/)
    expect(LLM_EXPORT_SCOPE).toMatch(/500/)
    expect(prompt).toContain('50')
    expect(prompt).toContain('500')
    expect(prompt).toMatch(new RegExp(`${SCANNER_CHECK_COUNT}\\+`))
    expect(prompt).toMatch(/Pages fetched: 12 \(cap 50\)/)
  })

  it('does not ask the model to invent CWV or citation %', () => {
    expect(prompt).toMatch(/Do not invent new measurements/)
    expect(LLM_EXPORT_DO_NOT).toMatch(/Invent Core Web Vitals numbers/)
    expect(LLM_EXPORT_DO_NOT).toMatch(/citation percentage/)
    expect(prompt).toMatch(/Skip anything that needs field Core Web Vitals, a citation %/)
    expect(prompt).not.toMatch(/measure LCP|report INP|invent a citation/i)
    expect(prompt).not.toMatch(/seoboost\.app/i)
  })

  it('includes failing findings and drops passing ones', () => {
    expect(prompt).toMatch(/AI snippet eligibility/)
    expect(prompt).toMatch(/\/pricing/)
    expect(prompt).not.toMatch(/Title Tag/)
    expect(prompt).not.toMatch(/GEO score 10/)
    expect(prompt).not.toMatch(/citation % 4/)
    expect(prompt).toMatch(/not a GEO score/)
  })

  it('empty findings stay honest and stop', () => {
    const empty = buildEditorFixPrompt({
      siteUrl: 'https://example.com',
      score: 91,
      findings: [{ label: 'Title Tag', status: 'good', message: 'ok' }],
    })
    expect(empty).toMatch(/No failed or warning HTML checks/)
    expect(empty).toMatch(/Do not invent issues, Core Web Vitals numbers/)
    expect(empty).not.toMatch(/seoboost\.app/i)
  })
})

describe('publicAuditSiteUrl', () => {
  it('does not export seoboost.app as the audited site', () => {
    expect(publicAuditSiteUrl('https://seoboost.app/report')).toBe('https://example.com')
    expect(publicAuditSiteUrl('https://example.com/blog')).toBe('https://example.com/blog')
  })
})
