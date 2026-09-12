import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  analysePage,
  calculatePageScore,
  evaluateRobotsTxt,
  SCORE_WEIGHTS,
} from '@/lib/scanner'
import { LLM_EXPORT_DENY, sanitizeAuditText } from '@/lib/llm-export'

const fixturesDir = dirname(fileURLToPath(import.meta.url))

function loadFixture(name: string) {
  return readFileSync(join(fixturesDir, 'fixtures', name), 'utf8')
}

function statusMap(html: string, url = 'https://example.com/about') {
  const result = analysePage(url, html, {}, new URL('https://example.com'))
  return Object.fromEntries(result.checks.map((c) => [c.id, c]))
}

const missingTitle = `<!DOCTYPE html><html lang="en"><head></head><body><h1>Hi</h1><p>Hello world content here.</p></body></html>`

const oneItemBreadcrumb = `<!DOCTYPE html><html lang="en"><head>
<title>Inner Page Title For Display</title>
<link rel="canonical" href="https://example.com/inner" />
<script type="application/ld+json">
[{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://example.com"}]}]
</script>
</head><body><h1>Inner page</h1><p>Visible body text for the first HTML extract.</p></body></html>`

const fakeRating = `<!DOCTYPE html><html lang="en"><head>
<title>Product Page With Fake Stars</title>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Demo","offers":{"@type":"Offer","price":"9.00","priceCurrency":"USD"},"aggregateRating":{"@type":"AggregateRating","ratingValue":"4.9","ratingCount":"120"}}
</script>
</head><body><h1>Demo app</h1><p>No visible reviews or star ratings on this page.</p></body></html>`

const faqHeadings = `<!DOCTYPE html><html lang="en"><head>
<title>Help Center Questions Answered</title>
<link rel="canonical" href="https://example.com/help" />
</head><body>
<h1>Help</h1>
<h2>What is a canonical tag?</h2>
<p>A canonical tag names the preferred URL. Visible FAQ copy is fine.</p>
<h2>How do I add one?</h2>
<p>Add a rel=canonical link in the document head.</p>
</body></html>`

describe('analysePage fixtures', () => {
  it('flags a missing title', () => {
    const checks = statusMap(missingTitle, 'https://example.com/')
    expect(checks.title.status).toBe('critical')
  })

  it('detects BreadcrumbList inside a top-level JSON-LD array', () => {
    const html = loadFixture('good-page.html')
    const checks = statusMap(html)
    expect(checks['breadcrumb-schema']?.status).toBe('good')
    expect(checks.schema.message + checks.schema.whyItMatters).not.toMatch(
      /eligible for rich results/i
    )
  })

  it('warns on a 1-item BreadcrumbList instead of marking it good', () => {
    const checks = statusMap(oneItemBreadcrumb, 'https://example.com/inner')
    expect(checks['breadcrumb-schema']?.status).toBe('warning')
    expect(checks.schema.status).not.toBe('good')
  })

  it('treats AggregateRating without visible reviews as critical', () => {
    const checks = statusMap(fakeRating, 'https://example.com/')
    expect(checks['aggregate-rating']?.status).toBe('critical')
  })

  it('does not sell FAQ headings as a live SERP / AIO rich result', () => {
    const checks = statusMap(faqHeadings, 'https://example.com/help')
    const faq = checks['faq-schema']
    expect(faq === undefined || faq.status === 'good').toBe(true)
    const blob = Object.values(checks)
      .map((c) => `${c.message} ${c.whyItMatters} ${c.howToFix}`)
      .join('\n')
    expect(blob).not.toMatch(/expandable Q&A|FAQ rich results|expandable SERP/i)
  })

  it('CSR-empty first HTML is a static-HTML warning, not a ranking penalty', () => {
    const html = loadFixture('csr-empty.html')
    const checks = statusMap(html, 'https://example.com/')
    expect(checks['ai-extractable-text']?.status).toBe('warning')
    expect(checks['ai-extractable-text']?.message).toMatch(/static HTML only/i)
    const word = checks['word-count']
    expect(`${word?.whyItMatters} ${word?.howToFix}`).not.toMatch(
      /Google will penalize|thin-content penalty/i
    )
  })

  it('golden score snapshot stays tied to SCORE_WEIGHTS', () => {
    const html = loadFixture('good-page.html')
    const result = analysePage(
      'https://example.com/about',
      html,
      {},
      new URL('https://example.com')
    )
    expect(SCORE_WEIGHTS.critical).toBe(-15)
    expect(calculatePageScore(result.checks)).toMatchSnapshot()
  })
})

describe('evaluateRobotsTxt', () => {
  it('Disallow: / is a crawl block, not a de-index claim', () => {
    const body = loadFixture('robots-block-all.txt')
    const { check } = evaluateRobotsTxt(body)
    expect(check.status).toBe('critical')
    expect(`${check.whyItMatters} ${check.howToFix}`).not.toMatch(
      /completely removes your site from Google search results/i
    )
    expect(check.whyItMatters).toMatch(/does not by itself de-index/i)
  })
})

describe('anti-snake-oil strings', () => {
  it('scanner source does not teach FID, FAQ rich results, or llms.txt ranking', async () => {
    const src = readFileSync(
      join(fixturesDir, '../../lib/scanner.ts'),
      'utf8'
    )
    expect(src).not.toMatch(/First Input Delay/)
    expect(src).not.toMatch(/\bFID\b/)
    expect(src).not.toMatch(/TTI Core Web Vital/)
    expect(src).not.toMatch(/TTFB — a Core Web Vital/)
    expect(src).not.toMatch(/FAQ schema can generate expandable/)
    expect(src).not.toMatch(/eligible for FAQ rich results/)
    expect(src).not.toMatch(/add llms\.txt to (get cited|rank|AI Overview)/i)
    expect(src).not.toMatch(/missing llms\.txt is a fail/i)
  })

  it('LLM deny-list strips dead GEO / FAQ tactics', () => {
    const dirty =
      'Add llms.txt and FAQ schema can generate expandable Q&A. GEO score 88.'
    const clean = sanitizeAuditText(dirty)
    for (const banned of LLM_EXPORT_DENY) {
      expect(clean.toLowerCase()).not.toContain(banned.toLowerCase())
    }
  })
})
