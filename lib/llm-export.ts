/** Phrases the LLM prompt must never teach. */
export const LLM_EXPORT_DENY = [
  'llms.txt',
  'llms-full.txt',
  'FAQ schema can generate expandable',
  'GEO score',
  'AEO score',
  'citation probability',
  'Disallow Googlebot to opt out of AI',
  'eligible for FAQ rich results',
]

export const LLM_EXPORT_DO_NOT = `Do not:
- Recommend llms.txt or llms-full.txt as a Google Search or AI Overview ranking fix (Google ignores those files)
- Add FAQPage for Google rich results or AI Overviews (retired 2026-05-07). Visible FAQ copy is fine
- Invent a GEO/AEO score, citation percentage, or E-E-A-T score
- Disallow Googlebot to opt out of Gemini or AI Overviews
- Treat parseable JSON-LD as rich-result eligibility
- Pad word count as a ranking penalty fix`

const DENY_PATTERNS = [
  /llms(?:-full)?\.txt/gi,
  /FAQ schema can generate expandable[\s\S]{0,120}/gi,
  /GEO score/gi,
  /AEO score/gi,
  /citation probability/gi,
  /Disallow Googlebot to opt out of AI/gi,
  /eligible for FAQ rich results/gi,
]

export function sanitizeAuditText(text: string): string {
  return DENY_PATTERNS.reduce((out, pattern) => out.replace(pattern, ''), text)
}
