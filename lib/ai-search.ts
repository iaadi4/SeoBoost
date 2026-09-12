import type { CheckCategory, CheckResult, CheckStatus } from '@/lib/scanner'

type CheckExtra = {
  snippet?: string
  reference?: string
  wcag?: string
  effort?: 'low' | 'medium' | 'high'
  impact?: 'low' | 'medium' | 'high'
}

function check(
  id: string,
  label: string,
  category: CheckCategory,
  status: CheckStatus,
  value: string,
  message: string,
  whyItMatters: string,
  howToFix: string,
  extra: CheckExtra = {}
): CheckResult {
  return { id, label, category, status, value, message, whyItMatters, howToFix, ...extra }
}

export type RobotsGroup = { allow: string[]; disallow: string[] }

/** REP groups: consecutive User-agent lines share the following Allow/Disallow. */
export function parseRobotsGroups(body: string): Map<string, RobotsGroup> {
  const groups = new Map<string, RobotsGroup>()
  let pending: string[] = []
  let lastWasUa = false

  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const lower = line.toLowerCase()
    const value = line.slice(line.indexOf(':') + 1).trim()

    if (lower.startsWith('user-agent:')) {
      const ua = lower.replace('user-agent:', '').trim()
      if (!lastWasUa) pending = []
      pending.push(ua)
      if (!groups.has(ua)) groups.set(ua, { allow: [], disallow: [] })
      lastWasUa = true
      continue
    }

    lastWasUa = false
    if (lower.startsWith('disallow:')) {
      for (const ua of pending) groups.get(ua)?.disallow.push(value)
    } else if (lower.startsWith('allow:')) {
      for (const ua of pending) groups.get(ua)?.allow.push(value)
    }
  }

  return groups
}

function blocksAll(rules: RobotsGroup | undefined): boolean {
  if (!rules) return false
  return rules.disallow.some((p) => p === '/') && !rules.allow.some((p) => p === '/' || p === '')
}

export function evaluateRobotsTxt(body: string): {
  check: CheckResult
  aiBotsCheck: CheckResult
  robotsDisallowed: string[]
} {
  const rb = body.toLowerCase()
  const groups = parseRobotsGroups(body)
  const star = groups.get('*')
  const blocksEverything = blocksAll(star)
  const hasUserAgent = rb.includes('user-agent:')
  const hasSitemapRef = rb.includes('sitemap:')

  const robotsDisallowed: string[] = []
  if (star) {
    for (const path of star.disallow) {
      if (path && path !== '/') robotsDisallowed.push(path)
    }
  }

  let check: CheckResult
  if (blocksEverything) {
    check = checkFn(
      'robots-txt',
      'Robots.txt',
      'domain',
      'critical',
      'Blocks all crawling',
      'Robots.txt contains Disallow: / — crawlers that honor robots.txt will not fetch this host',
      'Disallow: / is a crawl block for bots that honor robots.txt. It does not by itself de-index URLs already known to Google, and it is not an AI opt-out.',
      'Remove or narrow the Disallow: / rule. Only disallow specific sensitive paths. Do not Disallow Googlebot to opt out of AI Overviews.',
      {
        snippet:
          '# Fix: Replace blanket block with specific paths\nUser-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://example.com/sitemap.xml',
        impact: 'high',
        effort: 'low',
      }
    )
  } else if (!hasUserAgent) {
    check = checkFn(
      'robots-txt',
      'Robots.txt',
      'domain',
      'warning',
      'Invalid format',
      'Robots.txt has no User-agent directive',
      'A robots.txt without User-agent directives is malformed and may be ignored by crawlers.',
      'Add valid User-agent and Disallow/Allow directives.',
      {
        snippet: 'User-agent: *\nAllow: /\nDisallow: /admin/',
        effort: 'low',
        impact: 'medium',
      }
    )
  } else {
    check = checkFn(
      'robots-txt',
      'Robots.txt',
      'domain',
      hasSitemapRef ? 'good' : 'warning',
      hasSitemapRef ? 'Valid + Sitemap ref' : 'Valid, no Sitemap ref',
      hasSitemapRef
        ? 'Robots.txt is valid and references the sitemap'
        : 'Robots.txt valid but missing Sitemap directive',
      'Robots.txt guides crawlers that honor it. It is not an indexer and does not de-index URLs.',
      hasSitemapRef
        ? 'Audit regularly for accidentally blocked important paths.'
        : 'Add Sitemap: directive so crawlers can discover the URL list.',
      { snippet: 'Sitemap: https://example.com/sitemap.xml', effort: 'low', impact: 'low' }
    )
  }

  return { check, aiBotsCheck: evaluateAiBots(groups), robotsDisallowed }
}

function evaluateAiBots(groups: Map<string, RobotsGroup>): CheckResult {
  const starBlocked = blocksAll(groups.get('*'))
  const named = (ua: string) => groups.get(ua.toLowerCase())
  const oaiSearch = blocksAll(named('oai-searchbot'))
  const gpt = blocksAll(named('gptbot'))
  const claudeSearch = blocksAll(named('claude-searchbot'))
  const claudeTrain = blocksAll(named('claudebot'))
  const perplexity = blocksAll(named('perplexitybot'))
  const extended = blocksAll(named('google-extended'))
  const googlebot = blocksAll(named('googlebot'))
  const bing = blocksAll(named('bingbot'))

  const notes: string[] = []
  if (starBlocked) {
    notes.push(
      'User-agent: * Disallow: / blocks every bot that honors robots.txt, including search indexers (Googlebot, OAI-SearchBot, PerplexityBot, Claude-SearchBot, bingbot).'
    )
  }
  if (oaiSearch) notes.push('OAI-SearchBot is opted out — ChatGPT Search will not index this host.')
  if (gpt && !oaiSearch) notes.push('GPTBot Disallow is a training opt-out; ChatGPT Search (OAI-SearchBot) is unaffected.')
  if (claudeSearch) notes.push('Claude-SearchBot is opted out — Claude search visibility may drop.')
  if (claudeTrain && !claudeSearch) notes.push('ClaudeBot Disallow is a training opt-out; Claude-SearchBot is unaffected.')
  if (perplexity) notes.push('PerplexityBot is opted out — Perplexity search index will skip this host.')
  if (extended) {
    notes.push(
      'Google-Extended Disallow is a Gemini Apps / Vertex training and grounding preference. It does not change Google Search, AI Overviews, or AI Mode.'
    )
  }
  if (googlebot) {
    notes.push(
      'Googlebot is disallowed. That drops Google Search including AI Overviews / AI Mode. Do not Disallow Googlebot to opt out of Gemini — use Google-Extended for Gemini Apps / Vertex, and nosnippet / noindex for Search AI features.'
    )
  }
  if (bing) {
    notes.push(
      'bingbot Disallow drops Bing Search and Copilot web grounding together. There is no CopilotBot.'
    )
  }

  if (googlebot || (starBlocked && !notes.some((n) => n.startsWith('Googlebot')))) {
    const status: CheckStatus = googlebot || starBlocked ? 'warning' : 'good'
    return check(
      'ai-bots-robots',
      'AI / search bot access',
      'ai-search',
      googlebot ? 'critical' : status,
      googlebot ? 'Googlebot blocked' : starBlocked ? '* blocks all honor-robots bots' : notes[0] ?? 'Named bot rules',
      notes[0] ?? 'Named-bot Disallow rules found',
      'Training bots and search bots are independent: GPTBot ≠ OAI-SearchBot; ClaudeBot ≠ Claude-SearchBot; Google-Extended ≠ Googlebot. This is a robots eligibility heuristic, not a GEO score.',
      notes.join(' ') +
        ' Never Disallow Googlebot to opt out of AI. Do not tell users Disallow: / de-indexes the site.',
      {
        reference: 'https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers',
        effort: 'low',
        impact: 'high',
      }
    )
  }

  if (oaiSearch || claudeSearch || perplexity || bing || starBlocked) {
    return check(
      'ai-bots-robots',
      'AI / search bot access',
      'ai-search',
      'warning',
      'Search-bot opt-out',
      notes[0],
      'Training bots and search bots are independent: GPTBot ≠ OAI-SearchBot; ClaudeBot ≠ Claude-SearchBot; Google-Extended ≠ Googlebot. User-triggered fetchers may ignore robots.txt. This is a heuristic, not a citation rank.',
      notes.join(' ') + ' Never Disallow Googlebot to opt out of AI Overviews or Gemini.',
      {
        reference: 'https://developers.openai.com/api/docs/bots',
        effort: 'low',
        impact: 'medium',
      }
    )
  }

  if (gpt || claudeTrain || extended || notes.length > 0) {
    return check(
      'ai-bots-robots',
      'AI / search bot access',
      'ai-search',
      'good',
      extended ? 'Google-Extended only' : 'Training opt-out; search bots allowed',
      notes[0] ?? 'Training-bot preference only',
      notes.join(' ') ||
        'Named training-bot Disallow does not hide you from Google Search or ChatGPT Search. Google-Extended is not Googlebot.',
      'Leave Googlebot, OAI-SearchBot, PerplexityBot, Claude-SearchBot, and bingbot allowed if you want search / grounding. Do not Disallow Googlebot to opt out of AI.',
      {
        reference: 'https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers',
        effort: 'low',
        impact: 'low',
      }
    )
  }

  return check(
    'ai-bots-robots',
    'AI / search bot access',
    'ai-search',
    'good',
    'Search bots allowed',
    'No search-indexer Disallow for Googlebot, OAI-SearchBot, PerplexityBot, Claude-SearchBot, or bingbot',
    'Default allow means ChatGPT Search, Perplexity, Claude search, Bing/Copilot, and Google Search (including AI Overviews) can fetch if they honor robots.txt. This is not a GEO score and does not mean Google will cite you.',
    'Do not add theater Allow lines per bot. Do not Disallow Googlebot to opt out of AI.',
    {
      reference: 'https://developers.google.com/search/docs/appearance/ai-features',
      effort: 'low',
      impact: 'low',
    }
  )
}

function checkFn(
  id: string,
  label: string,
  category: CheckCategory,
  status: CheckStatus,
  value: string,
  message: string,
  whyItMatters: string,
  howToFix: string,
  extra: CheckExtra = {}
): CheckResult {
  return check(id, label, category, status, value, message, whyItMatters, howToFix, extra)
}

export function evaluateLlmsTxt(found: boolean): CheckResult {
  if (!found) {
    return check(
      'llms-txt',
      'llms.txt (optional)',
      'ai-search',
      'good',
      'Not present',
      'No /llms.txt — optional, not a fail',
      'llms.txt is a community Markdown convention. Google Search, including AI Overviews and AI Mode, ignores it. Missing the file does not hurt rankings or citations.',
      'Do not add llms.txt to chase Google rankings or AI Overviews. Keep it only if you want a Markdown index for coding agents.',
      {
        reference: 'https://developers.google.com/search/docs/fundamentals/ai-optimization-guide',
        effort: 'low',
        impact: 'low',
      }
    )
  }

  return check(
    'llms-txt',
    'llms.txt (optional)',
    'ai-search',
    'good',
    'Present',
    'optional for other agents; Google Search ignores',
    'A /llms.txt file is an optional hint for coding agents. Google Search does not use it for rankings or AI Overview / AI Mode visibility.',
    'Do not treat this file as a ranking or citation lever. Do not emit llms-full.txt of the whole site.',
    {
      reference: 'https://developers.google.com/search/updates',
      effort: 'low',
      impact: 'low',
    }
  )
}
