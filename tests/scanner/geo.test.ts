import { describe, expect, it } from 'vitest'
import {
  analysePage,
  evaluateLlmsTxt,
  evaluateRobotsTxt,
} from '@/lib/scanner'

function statusMap(html: string, url = 'https://example.com/pricing') {
  const result = analysePage(url, html, {}, new URL('https://example.com'))
  return Object.fromEntries(result.checks.map((c) => [c.id, c]))
}

const page = (extraHead: string, extraBody = '<main><h1>Pricing</h1><p>Plans for teams who want HTML SEO checks.</p></main>') =>
  `<!DOCTYPE html><html lang="en"><head>
<title>Pricing Plans For Example</title>
<link rel="canonical" href="https://example.com/pricing" />
${extraHead}
</head><body>${extraBody}</body></html>`

describe('04-02 AI snippet eligibility', () => {
  it('warns on nosnippet as AIO / AI Mode input withhold, not a ranking penalty', () => {
    const checks = statusMap(page('<meta name="robots" content="nosnippet" />'))
    expect(checks['ai-snippet-eligible']?.status).toBe('warning')
    expect(checks['ai-snippet-eligible']?.message).toMatch(
      /AI Overviews \/ AI Mode as a direct input/i
    )
    expect(checks['ai-snippet-eligible']?.whyItMatters).toMatch(
      /not a ranking penalty and not a GEO score/i
    )
  })

  it('treats max-snippet:0 the same as nosnippet', () => {
    const checks = statusMap(page('<meta name="robots" content="max-snippet:0" />'))
    expect(checks['ai-snippet-eligible']?.status).toBe('warning')
    expect(checks['ai-snippet-eligible']?.value).toMatch(/max-snippet:0/)
  })

  it('warns when data-nosnippet wraps main', () => {
    const checks = statusMap(
      page('', '<main data-nosnippet><h1>Pricing</h1><p>Hidden from snippets.</p></main>')
    )
    expect(checks['ai-snippet-eligible']?.status).toBe('warning')
    expect(checks['ai-snippet-eligible']?.value).toMatch(/data-nosnippet/)
  })

  it('default snippet-allowed pages pass', () => {
    const checks = statusMap(page('<meta name="robots" content="max-snippet:-1" />'))
    expect(checks['ai-snippet-eligible']?.status).toBe('good')
  })
})

describe('04-09 Bing vs Google noarchive', () => {
  it('noarchive is a Bing/Copilot control; Google ignores it', () => {
    const checks = statusMap(page('<meta name="robots" content="noarchive" />'))
    expect(checks['ai-snippet-eligible']?.status).toBe('warning')
    expect(checks['ai-snippet-eligible']?.message).toMatch(/Bing Chat \/ Copilot/)
    expect(checks['ai-snippet-eligible']?.message).toMatch(/Google ignores noarchive/)
  })
})

describe('04-03 training vs search bots', () => {
  it('OAI-SearchBot Disallow warns ChatGPT Search opted out', () => {
    const { aiBotsCheck } = evaluateRobotsTxt(
      'User-agent: OAI-SearchBot\nDisallow: /\n\nUser-agent: *\nAllow: /\n'
    )
    expect(aiBotsCheck.status).toBe('warning')
    expect(aiBotsCheck.message).toMatch(/ChatGPT Search/)
    expect(aiBotsCheck.howToFix).toMatch(/Never Disallow Googlebot/)
  })

  it('GPTBot-only Disallow is a training opt-out, not ChatGPT Search', () => {
    const { aiBotsCheck } = evaluateRobotsTxt(
      'User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /\n'
    )
    expect(aiBotsCheck.status).toBe('good')
    expect(aiBotsCheck.message).toMatch(/training opt-out/i)
    expect(aiBotsCheck.message).toMatch(/OAI-SearchBot/)
  })

  it('Google-Extended-only Disallow does not change Search / AIO', () => {
    const { aiBotsCheck } = evaluateRobotsTxt(
      'User-agent: Google-Extended\nDisallow: /\n\nUser-agent: *\nAllow: /\n'
    )
    expect(aiBotsCheck.status).toBe('good')
    expect(aiBotsCheck.message + aiBotsCheck.whyItMatters).toMatch(
      /Gemini Apps|Vertex/
    )
    expect(aiBotsCheck.message + aiBotsCheck.whyItMatters).toMatch(
      /does not change Google Search|not Googlebot/i
    )
  })

  it('Bingbot Disallow warns Bing Search + Copilot both lose the host', () => {
    const { aiBotsCheck } = evaluateRobotsTxt(
      'User-agent: bingbot\nDisallow: /\n\nUser-agent: *\nAllow: /\n'
    )
    expect(aiBotsCheck.status).toBe('warning')
    expect(aiBotsCheck.message + aiBotsCheck.howToFix).toMatch(
      /Bing Search and Copilot/
    )
  })
})

describe('04-04 llms.txt is optional', () => {
  it('missing llms.txt is good / not a fail', () => {
    const result = evaluateLlmsTxt(false)
    expect(result.status).toBe('good')
    expect(result.message).toMatch(/not a fail/i)
    expect(result.whyItMatters).toMatch(/ignores/)
    expect(result.howToFix).toMatch(/Do not add llms\.txt to chase/)
  })
})
