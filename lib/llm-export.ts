import { SCANNER_CHECK_COUNT } from '@/lib/claims'
import { HOBBY_MAX_PAGES, PRO_MAX_PAGES } from '@/lib/crawl-limits'

/** Phrases the LLM prompt must never teach. */
export const LLM_EXPORT_DENY = [
  'llms.txt',
  'llms-full.txt',
  'FAQ schema can generate expandable',
  'GEO score',
  'AEO score',
  'citation probability',
  'citation percentage',
  'citation %',
  'Disallow Googlebot to opt out of AI',
  'eligible for FAQ rich results',
]

export const LLM_EXPORT_DO_NOT = `Do not:
- Recommend llms.txt or llms-full.txt as a Google Search or AI Overview ranking fix (Google ignores those files)
- Add FAQPage for Google rich results or AI Overviews (retired 2026-05-07). Visible FAQ copy is fine
- Invent a GEO/AEO score, citation percentage, or E-E-A-T score
- Invent Core Web Vitals numbers (LCP, INP, CLS) — this audit did not measure field or lab CWV
- Disallow Googlebot to opt out of Gemini or AI Overviews
- Treat parseable JSON-LD as rich-result eligibility
- Pad word count as a ranking penalty fix
- Ask for or fabricate citation %`

export const LLM_EXPORT_SCOPE = `This is a first-HTML technical SEO audit (no JavaScript render, no CrUX, no lab or field Core Web Vitals). Hobby crawls up to ${HOBBY_MAX_PAGES} pages; Pro up to ${PRO_MAX_PAGES}. The scanner runs ${SCANNER_CHECK_COUNT}+ HTML and domain checks and an A–F health score from those checks only — not a GEO score and not a citation percentage.`

const DENY_PATTERNS = [
  /llms(?:-full)?\.txt/gi,
  /FAQ schema can generate expandable[\s\S]{0,120}/gi,
  /GEO score/gi,
  /AEO score/gi,
  /citation probability/gi,
  /citation percentage/gi,
  /citation\s*%/gi,
  /Disallow Googlebot to opt out of AI/gi,
  /eligible for FAQ rich results/gi,
]

export function sanitizeAuditText(text: string): string {
  return DENY_PATTERNS.reduce((out, pattern) => out.replace(pattern, ''), text)
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export type FixPromptFinding = {
  id?: string
  label: string
  status: 'good' | 'warning' | 'critical' | string
  issueText?: string
  message?: string
  howToFix?: string
  worstPage?: string
  value?: string
  currentValue?: string
}

export type BuildFixPromptInput = {
  siteUrl: string
  score?: number
  grade?: string
  pagesCrawled?: number
  pageCap?: number
  findings: FixPromptFinding[]
}

/** Drop our own marketing host if a caller passes it as the audited site. */
export function publicAuditSiteUrl(raw: string): string {
  try {
    const u = new URL(raw)
    if (/(^|\.)seoboost\.app$/i.test(u.hostname)) return 'https://example.com'
    return `${u.origin}${u.pathname === '/' ? '' : u.pathname}`
  } catch {
    return 'https://example.com'
  }
}

export function findingsFromAggregated(
  rows: Array<{
    id?: string
    label: string
    status: 'good' | 'warning' | 'critical' | string
    issueText?: string
    howToFix?: string
    worstPage?: string
    currentValue?: string
  }>
): FixPromptFinding[] {
  return rows
    .filter((row) => row.status !== 'good')
    .map((row) => ({
      id: row.id,
      label: row.label,
      status: row.status,
      issueText: row.issueText,
      howToFix: row.howToFix,
      worstPage: row.worstPage,
      currentValue: row.currentValue,
    }))
}

function formatFinding(finding: FixPromptFinding): string {
  const issue = sanitizeAuditText(finding.issueText || finding.message || '')
  const fix = finding.howToFix ? sanitizeAuditText(finding.howToFix) : ''
  const value = finding.value || finding.currentValue
  const lines = [
    `- **${finding.label}** (${finding.status}): ${issue || 'See documented fix.'}`,
  ]
  if (value) lines.push(`  Evidence: ${sanitizeAuditText(value)}`)
  if (finding.worstPage) lines.push(`  Page: ${finding.worstPage}`)
  if (fix) lines.push(`  Documented fix: ${fix}`)
  return lines.join('\n')
}

/**
 * Pasteable editor prompt from failing findings.
 * Report UI can import this; it must not ask the model to invent CWV or citation %.
 */
export function buildEditorFixPrompt(input: BuildFixPromptInput): string {
  const siteUrl = publicAuditSiteUrl(input.siteUrl)
  const failed = input.findings.filter((f) => f.status !== 'good')
  const cap =
    input.pageCap ??
    `${HOBBY_MAX_PAGES} Hobby / ${PRO_MAX_PAGES} Pro`
  const crawled =
    typeof input.pagesCrawled === 'number' ? String(input.pagesCrawled) : 'not recorded'
  const scoreBit =
    typeof input.score === 'number'
      ? `Health score ${input.score}/100${input.grade ? ` (${input.grade})` : ''} is from the HTML checks only — not CWV, not a GEO score.`
      : 'No health score was exported. Do not invent one.'

  if (failed.length === 0) {
    return [
      `You are the site owner's editor for ${siteUrl}.`,
      '',
      LLM_EXPORT_SCOPE,
      scoreBit,
      `Pages fetched: ${crawled} (cap ${cap}).`,
      '',
      'No failed or warning HTML checks were exported. Say that and stop.',
      'Do not invent issues, Core Web Vitals numbers, a GEO score, or a citation %.',
      '',
      LLM_EXPORT_DO_NOT,
    ].join('\n')
  }

  return [
    `You are the site owner's editor (markup, templates, robots.txt, meta tags) for ${siteUrl}.`,
    'Fix only the listed first-HTML findings. You are not inventing lab metrics.',
    '',
    LLM_EXPORT_SCOPE,
    scoreBit,
    `Pages fetched: ${crawled} (cap ${cap}).`,
    '',
    'Failed / warning findings:',
    failed.map(formatFinding).join('\n'),
    '',
    'For each finding:',
    '1. Restate the evidence in one line. Do not invent new measurements.',
    "2. Give the exact first-HTML, robots, or meta change. Use the site's existing stack if obvious; do not assume Next.js.",
    '3. Skip anything that needs field Core Web Vitals, a citation %, or ChatGPT scraping.',
    '',
    LLM_EXPORT_DO_NOT,
  ].join('\n')
}
