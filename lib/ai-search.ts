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

/** Search-index fetchers vs training / grounding-preference crawlers. */
export const AI_SEARCH_BOTS = [
  'googlebot',
  'oai-searchbot',
  'claude-searchbot',
  'perplexitybot',
  'bingbot',
] as const

export const AI_TRAINING_BOTS = ['gptbot', 'claudebot', 'google-extended'] as const

const HEURISTIC_NOT_GEO =
  'This is a robots eligibility heuristic, not a GEO score and not a citation percentage.'

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

  let robotsCheck: CheckResult
  if (blocksEverything) {
    robotsCheck = check(
      'robots-txt',
      'Robots.txt',
      'domain',
      'critical',
      'Blocks all crawling',
      'Robots.txt contains Disallow: / — crawlers that honor robots.txt will not fetch this host',
      'Disallow: / is a crawl block for bots that honor robots.txt. It does not by itself de-index URLs already known to Google, and it is not an AI opt-out.',
      'Remove or narrow the Disallow: / rule. Only disallow specific sensitive paths. Blocking Googlebot is a Search opt-out, not an AI-training switch.',
      {
        snippet:
          '# Fix: Replace blanket block with specific paths\nUser-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://example.com/sitemap.xml',
        impact: 'high',
        effort: 'low',
      }
    )
  } else if (!hasUserAgent) {
    robotsCheck = check(
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
    robotsCheck = check(
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

  return { check: robotsCheck, aiBotsCheck: evaluateAiBots(groups), robotsDisallowed }
}

function evaluateAiBots(groups: Map<string, RobotsGroup>): CheckResult {
  const starBlocked = blocksAll(groups.get('*'))
  const named = (ua: string) => blocksAll(groups.get(ua.toLowerCase()))
  const oaiSearch = named('oai-searchbot')
  const gpt = named('gptbot')
  const claudeSearch = named('claude-searchbot')
  const claudeTrain = named('claudebot')
  const perplexity = named('perplexitybot')
  const extended = named('google-extended')
  const googlebot = named('googlebot')
  const bing = named('bingbot')

  const blockedSearch: string[] = []
  if (starBlocked) blockedSearch.push('User-agent: *')
  if (googlebot) blockedSearch.push('Googlebot')
  if (oaiSearch) blockedSearch.push('OAI-SearchBot')
  if (claudeSearch) blockedSearch.push('Claude-SearchBot')
  if (perplexity) blockedSearch.push('PerplexityBot')
  if (bing) blockedSearch.push('bingbot')

  const trainingOnly: string[] = []
  if (gpt && !oaiSearch) trainingOnly.push('GPTBot')
  if (claudeTrain && !claudeSearch) trainingOnly.push('ClaudeBot')
  if (extended) trainingOnly.push('Google-Extended')

  const notes: string[] = []
  if (starBlocked) {
    notes.push(
      'User-agent: * Disallow: / blocks every bot that honors robots.txt, including search indexers (Googlebot, OAI-SearchBot, PerplexityBot, Claude-SearchBot, bingbot). User-triggered fetchers (in-chat browse) may still ignore robots.txt.'
    )
  }
  if (oaiSearch) notes.push('OAI-SearchBot is opted out — ChatGPT Search will not index this host.')
  if (gpt && !oaiSearch) {
    notes.push(
      'GPTBot Disallow is a training opt-out; ChatGPT Search (OAI-SearchBot) is unaffected.'
    )
  }
  if (claudeSearch) notes.push('Claude-SearchBot is opted out — Claude search visibility may drop.')
  if (claudeTrain && !claudeSearch) {
    notes.push('ClaudeBot Disallow is a training opt-out; Claude-SearchBot is unaffected.')
  }
  if (perplexity) notes.push('PerplexityBot is opted out — Perplexity search index will skip this host.')
  if (extended) {
    notes.push(
      'Google-Extended Disallow is a Gemini Apps / Vertex training and grounding preference. It does not change Google Search, AI Overviews, or AI Mode.'
    )
  }
  if (googlebot) {
    notes.push(
      'Googlebot is disallowed. That drops Google Search including AI Overviews / AI Mode. Use Google-Extended for Gemini Apps / Vertex, and nosnippet / noindex for Search AI-feature input — not a Googlebot block.'
    )
  }
  if (bing) {
    notes.push(
      'bingbot Disallow drops Bing Search and Copilot web grounding together. There is no CopilotBot.'
    )
  }

  const evidence =
    [
      blockedSearch.length ? `Search blocked: ${blockedSearch.join(', ')}` : '',
      trainingOnly.length ? `Training preference: ${trainingOnly.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('. ') || 'No named-bot Disallow: /'

  const twins =
    'Training bots and search bots are independent: GPTBot ≠ OAI-SearchBot; ClaudeBot ≠ Claude-SearchBot; Google-Extended ≠ Googlebot. '

  const neverGooglebotAi =
    'Never Disallow Googlebot as an AI opt-out. Blocking Googlebot is a Search opt-out, not an AI-training switch.'

  if (googlebot) {
    return check(
      'ai-bots-robots',
      'AI / search bot access',
      'ai-search',
      'critical',
      'Googlebot blocked',
      notes.find((n) => n.startsWith('Googlebot')) ?? notes[0] ?? 'Googlebot Disallow: /',
      twins + HEURISTIC_NOT_GEO,
      `${notes.join(' ')} ${neverGooglebotAi} Do not tell users Disallow: / de-indexes the site.`,
      {
        snippet: evidence,
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
      starBlocked ? '* blocks all honor-robots bots' : 'Search-bot opt-out',
      notes[0],
      twins +
        'User-triggered fetchers may ignore robots.txt. ' +
        HEURISTIC_NOT_GEO,
      `${notes.join(' ')} ${neverGooglebotAi}`,
      {
        snippet: evidence,
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
      extended && !gpt && !claudeTrain
        ? 'Google-Extended only'
        : 'Training opt-out; search bots allowed',
      notes[0] ?? 'Training-bot preference only',
      notes.join(' ') ||
        'Named training-bot Disallow does not hide you from Google Search or ChatGPT Search. Google-Extended is not Googlebot.',
      'Leave Googlebot, OAI-SearchBot, PerplexityBot, Claude-SearchBot, and bingbot allowed if you want search / grounding. ' +
        neverGooglebotAi,
      {
        snippet: evidence,
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
    'Do not add theater Allow lines per bot. ' + neverGooglebotAi,
    {
      snippet: evidence,
      reference: 'https://developers.google.com/search/docs/appearance/ai-features',
      effort: 'low',
      impact: 'low',
    }
  )
}

export type SnippetSignals = {
  robotsMeta: string
  xRobotsHeader: string
  googleBotMeta: string
  bingBotMeta: string
  dataNosnippetOnMain: boolean
}

function snippetFlags(blob: string) {
  const s = blob.toLowerCase()
  return {
    nosnippet: s.includes('nosnippet'),
    maxSnippetZero: /max-snippet\s*:\s*0/.test(s),
    noarchive: s.includes('noarchive'),
    nocache: s.includes('nocache'),
  }
}

function snippetEvidenceLines(signals: SnippetSignals): string[] {
  const lines: string[] = []
  const push = (label: string, text: string) => {
    const d = snippetFlags(text)
    const bits = [
      d.nosnippet && 'nosnippet',
      d.maxSnippetZero && 'max-snippet:0',
      d.noarchive && 'noarchive',
      d.nocache && 'nocache',
    ].filter(Boolean) as string[]
    if (bits.length) lines.push(`${label}: ${bits.join(', ')}`)
  }
  push('meta robots', signals.robotsMeta)
  push('X-Robots-Tag', signals.xRobotsHeader)
  push('googlebot meta', signals.googleBotMeta)
  push('bingbot meta', signals.bingBotMeta)
  if (signals.dataNosnippetOnMain) lines.push('data-nosnippet on <main> or <article>')
  return lines
}

/** Google snippet / AIO input vs Bing archive controls. Not a citation rank. */
export function evaluateAiSnippetEligible(signals: SnippetSignals): CheckResult {
  const combined = `${signals.robotsMeta} ${signals.xRobotsHeader} ${signals.googleBotMeta} ${signals.bingBotMeta}`
  const flags = snippetFlags(combined)
  const hasNosnippet = flags.nosnippet || flags.maxSnippetZero
  const evidence = snippetEvidenceLines(signals)
  const evidenceText = evidence.length ? `Evidence: ${evidence.join('; ')}.` : 'No snippet withhold directives.'

  if (hasNosnippet || signals.dataNosnippetOnMain) {
    const googleBits = [
      flags.nosnippet && 'nosnippet',
      flags.maxSnippetZero && 'max-snippet:0',
      signals.dataNosnippetOnMain && 'data-nosnippet on main',
    ].filter(Boolean) as string[]
    const bingBits = [
      flags.noarchive && 'noarchive',
      flags.nocache && 'nocache',
    ].filter(Boolean) as string[]
    const value = flags.maxSnippetZero
      ? 'max-snippet:0'
      : flags.nosnippet
        ? 'nosnippet'
        : 'data-nosnippet on main'

    return check(
      'ai-snippet-eligible',
      'AI snippet eligibility',
      'ai-search',
      'warning',
      value,
      `Page text is withheld from Google AI Overviews / AI Mode as a direct input (${googleBits.join(', ')}); the URL may still rank as a result without a snippet` +
        (bingBits.length
          ? `. Also found ${bingBits.join(', ')} (Bing Chat / Copilot; Google ignores noarchive).`
          : ''),
      'nosnippet, max-snippet:0, and data-nosnippet on main content block the page as a direct input to AI Overviews and AI Mode. This is an eligibility heuristic, not a ranking penalty and not a GEO score.',
      `${evidenceText} If this URL should be usable as AI Overview / AI Mode input, remove ${googleBits.join(' and ')} from public HTML and X-Robots-Tag. Keep data-nosnippet on paywall or sensitive fragments only. Do not treat this as a ranking penalty or a citation percentage.` +
        (bingBits.length
          ? ' noarchive/nocache do not withhold Google AI-feature input.'
          : ''),
      {
        snippet: evidence.join('\n') || undefined,
        reference: 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag',
        effort: 'low',
        impact: 'high',
      }
    )
  }

  if (flags.noarchive || flags.nocache) {
    return check(
      'ai-snippet-eligible',
      'AI snippet eligibility',
      'ai-search',
      'warning',
      flags.noarchive ? 'noarchive' : 'nocache',
      flags.noarchive
        ? 'noarchive is a Bing Chat / Copilot control (2023); Google ignores noarchive'
        : 'nocache limits Bing Chat / Copilot to URL/title/snippet',
      'Bing noarchive excludes the page from Bing Chat / Copilot answers while Bing Search listings remain. Google documents noarchive as unused. This is not a Google AI opt-out and not a GEO score.',
      `${evidenceText} Do not treat noarchive as a Google AI Overview control. To withhold Google AI-feature input, use nosnippet / max-snippet / noindex. Disallowing bingbot also drops Bing Search, not only Copilot.`,
      {
        snippet: evidence.join('\n') || undefined,
        reference: 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag',
        effort: 'low',
        impact: 'low',
      }
    )
  }

  return check(
    'ai-snippet-eligible',
    'AI snippet eligibility',
    'ai-search',
    'good',
    'Snippet allowed',
    'No nosnippet / max-snippet:0 / main data-nosnippet detected',
    'Google AI Overviews and AI Mode use indexed, snippet-eligible pages. This check is a heuristic for those preview controls, not a citation rank or GEO score.',
    'Keep public pages snippet-eligible unless you intend to withhold body text from AI features. Eligibility is not a citation percentage.',
    {
      reference: 'https://developers.google.com/search/docs/appearance/ai-features',
    }
  )
}

export type ExtractableSignals = {
  wordCount: number
  mainTextLength: number
  looksLikeCsr: boolean
}

/** First-HTML extractability. CSR shells fail; this is not a citation %. */
export function evaluateExtractableText(signals: ExtractableSignals): CheckResult {
  const { wordCount, mainTextLength, looksLikeCsr } = signals
  const thinMain = mainTextLength < 40 && wordCount < 40
  const thin = wordCount < 20 || looksLikeCsr || thinMain
  const value = `${wordCount} words in first HTML`

  if (thin) {
    const flavor = looksLikeCsr
      ? `CSR shell (#root/#app) with ${wordCount} words`
      : thinMain
        ? `${wordCount} words; <main>/<article> ${mainTextLength} chars`
        : `${wordCount} words in first HTML`

    return check(
      'ai-extractable-text',
      'First-HTML extractable text',
      'ai-search',
      'warning',
      value,
      'static HTML only — little extractable text in the first response',
      'This scanner and AI search crawlers (OAI-SearchBot, PerplexityBot, Claude-SearchBot) read the first HTTP HTML. Text that appears only after JavaScript is invisible to them. This is an eligibility heuristic, not a GEO score or a citation percentage.',
      looksLikeCsr
        ? `Evidence: ${flavor}. Ship the definitional answer in the first HTML (SSR/SSG or a server-rendered <main>). A client-only #root/#app shell is not extractable. Do not pad word count as a ranking fix.`
        : `Evidence: ${flavor}. Put the answer in a server-rendered <article> or <main> in the first HTML. Do not hide the H1 behind client-only islands. Do not pad words to hit a number.`,
      { effort: 'medium', impact: 'high', snippet: `Evidence: ${flavor}` }
    )
  }

  return check(
    'ai-extractable-text',
    'First-HTML extractable text',
    'ai-search',
    'good',
    value,
    'First HTML has extractable main text',
    'Crawlers and this scanner read the first HTML response. Visible first-HTML copy is the eligibility gate — still SEO (indexed + snippet-eligible), not a special GEO ranking system.',
    'Keep the answer in the initial HTML as the page grows. Do not treat extractable text as a citation percentage.',
  )
}

/** Missing /llms.txt is never a fail. Presence is not a Google ranking pass. */
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
    'Present — still optional',
    'Found /llms.txt — optional for other agents; Google Search ignores; not a ranking pass',
    'A /llms.txt file is an optional hint for coding agents. Google Search does not use it for rankings or AI Overview / AI Mode visibility. Presence is not a win and absence is not a fail.',
    'Do not treat this file as a ranking or citation lever. Do not emit llms-full.txt of the whole site.',
    {
      reference: 'https://developers.google.com/search/updates',
      effort: 'low',
      impact: 'low',
    }
  )
}
