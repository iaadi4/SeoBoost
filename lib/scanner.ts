import * as cheerio from 'cheerio'

export type CheckStatus = 'good' | 'warning' | 'critical'

export type CheckCategory =
  | 'meta'             // Title, description, canonical, robots, URL
  | 'content'          // Headings, word count, readability, keyword usage
  | 'technical'        // Doctype, charset, viewport, compression, caching
  | 'performance'      // CWV hints: lazy loading, render-blocking, resource hints
  | 'social'           // Open Graph, Twitter Cards
  | 'accessibility'    // WCAG: lang, alt, ARIA, skip nav, forms, semantic HTML
  | 'security'         // HTTPS, HSTS, security headers, CSP
  | 'links'            // Internal linking, external rel, anchor text, placeholders
  | 'images'           // Alt text, dimensions, format hints
  | 'structured-data'  // JSON-LD validity, Schema types, FAQ/Video opportunity
  | 'domain'           // Robots.txt, XML Sitemap (checked once per scan)

export interface CheckResult {
  id: string
  label: string
  category: CheckCategory
  status: CheckStatus
  /** Short display value shown in the UI card */
  value: string
  /** One-line summary of the finding */
  message: string
  /** 2–3 sentence explanation of SEO/UX impact */
  whyItMatters: string
  /** Actionable fix instructions */
  howToFix: string
  /** Copy-paste code snippet */
  snippet?: string
  /** WCAG / Google spec reference URL */
  reference?: string
  /** WCAG success criterion, e.g. "1.1.1 Level A" */
  wcag?: string
  /** Rough effort estimate */
  effort?: 'low' | 'medium' | 'high'
  /** Expected impact if fixed */
  impact?: 'low' | 'medium' | 'high'
}

export interface PageAnalysis {
  url: string
  path: string
  /** 0–100 score derived from check statuses */
  score: number
  issuesCount: number
  checks: CheckResult[]
}

export interface AggregatedCheck {
  id: string
  label: string
  category: CheckCategory
  status: CheckStatus
  /** Representative value to display (worst-case page or domain value) */
  currentValue: string
  issueCount: number
  totalScanned: number
  issueText: string
  whyItMatters: string
  howToFix: string
  snippet?: string
  reference?: string
  wcag?: string
  effort?: 'low' | 'medium' | 'high'
  impact?: 'low' | 'medium' | 'high'
  /** Path of the worst-affected page */
  worstPage?: string
  /** Per-page breakdown */
  pageBreakdown?: Array<{ path: string; status: CheckStatus; value: string; message: string }>
}

export interface ScanSummary {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  criticalIssues: number
  warningIssues: number
  passedChecks: number
  totalChecks: number
  /** Prioritised list of top-5 issues to fix first */
  topPriorities: AggregatedCheck[]
}

export interface SEOReport {
  domain: string
  summary: ScanSummary
  pagesScanned: number
  pageAnalysis: PageAnalysis[]
  aggregatedChecks: AggregatedCheck[]
  checksByCategory: Record<CheckCategory, AggregatedCheck[]>
  scannedAt: string
  /** Total scan duration in ms */
  durationMs: number
}

export interface ScanOptions {
  /** Max HTML pages to crawl. Default: 5 */
  maxPages?: number
  /** Per-request timeout in ms. Default: 10 000 */
  fetchTimeoutMs?: number
  /** Strip tracking params from crawled URLs. Default: true */
  stripTrackingParams?: boolean
  /** Custom User-Agent string */
  userAgent?: string
  /**
   * Next.js fetch cache revalidation in seconds.
   * Pass 0 to always fetch fresh. Default: 3600
   */
  revalidate?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

interface FetchResult {
  html: string
  headers: Record<string, string>
  status: number
  finalUrl: string
}

interface RawPageResult {
  url: string
  path: string
  checks: CheckResult[]
  outboundLinks: string[]
}

const DEFAULTS: Required<ScanOptions> = {
  maxPages: 5,
  fetchTimeoutMs: 10_000,
  stripTrackingParams: true,
  userAgent: 'SEOScanBot/2.0 (+https://seoscan.dev/bot)',
  revalidate: 3600,
}

const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'utm_id', 'fbclid', 'gclid', 'gad_source', '_ga', 'msclkid', 'ref',
  'mc_cid', 'mc_eid', 'igshid', 'twclid',
]

/**
 * URL patterns that indicate programmatic / non-canonical pages.
 * These are skipped during crawling.
 */
const PROGRAMMATIC_PATTERNS: RegExp[] = [
  // Static assets
  /\.(xml|json|txt|csv|css|js|mjs|ts|map|woff2?|ttf|eot|otf|ico|png|jpe?g|gif|svg|webp|avif|pdf|zip|gz|tar|br)(\?.*)?$/i,
  // CMS / framework internals
  /^\/api\//i,
  /^\/wp-json\//i,
  /^\/wp-admin\//i,
  /^\/wp-content\//i,
  /^\/wp-includes\//i,
  /^\/_next\//i,
  /^\/__/i,
  /^\/cdn-cgi\//i,
  /^\/\.well-known\//i,
  // Feeds & archives
  /\/feed\/?(\?.*)?$/i,
  /\/rss\/?(\?.*)?$/i,
  /\/atom\/?(\?.*)?$/i,
  /\/\d{4}\/\d{2}\/\d{2}\//i,   // Date-based archives /2024/01/15/
  // Taxonomy & pagination (usually low SEO value; crawl separately if needed)
  /\/tag\//i,
  /\/tags\//i,
  /\/author\//i,
  /\/page\/\d+\/?$/i,
  // Search & filter URLs
  /[?&](s|q|search|query|filter|sort|order|min_price|max_price)=/i,
  // Checkout / account
  /^\/(checkout|cart|account|login|register|signup|sign-up|dashboard)\/?/i,
]

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function isProgrammatic(pathname: string, search: string): boolean {
  const full = pathname + search
  return PROGRAMMATIC_PATTERNS.some(p => p.test(full))
}

function normaliseUrl(raw: string, origin: string, opts: Required<ScanOptions>): string {
  try {
    const u = new URL(raw, origin)
    u.hash = ''
    if (opts.stripTrackingParams) {
      TRACKING_PARAMS.forEach(p => u.searchParams.delete(p))
    }
    // Remove trailing slash except for origin root
    let href = u.href
    if (href !== origin + '/' && href !== origin && href.endsWith('/')) {
      href = href.slice(0, -1)
    }
    return href
  } catch {
    return raw
  }
}

function gradeFromScore(score: number): ScanSummary['grade'] {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 45) return 'D'
  return 'F'
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH
// ─────────────────────────────────────────────────────────────────────────────

async function fetchUrl(
  url: string,
  opts: Required<ScanOptions>,
  acceptXml = false
): Promise<FetchResult | null> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': opts.userAgent,
        Accept: acceptXml
          ? 'application/xml,text/xml,*/*;q=0.8'
          : 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(opts.fetchTimeoutMs),
      // Next.js App Router cache control
      next: { revalidate: opts.revalidate },
    })

    const headers: Record<string, string> = {}
    res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v })

    if (!res.ok) return null

    const html = await res.text()
    return { html, headers, status: res.status, finalUrl: res.url }
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK BUILDER
// ─────────────────────────────────────────────────────────────────────────────

interface CheckExtra {
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGE-LEVEL ANALYSIS  (~35 checks)
// ─────────────────────────────────────────────────────────────────────────────

function analysePage(
  urlStr: string,
  html: string,
  responseHeaders: Record<string, string>,
  domainUrl: URL
): RawPageResult {
  const url = new URL(urlStr)
  let path = url.pathname || '/'
  if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1)

  const $ = cheerio.load(html)
  const checks: CheckResult[] = []

  // ── META: Title ────────────────────────────────────────────────────────────
  const title = $('title').first().text().trim()
  const titleLen = title.length
  if (titleLen === 0) {
    checks.push(check('title', 'Title Tag', 'meta', 'critical', 'Missing',
      'No <title> tag found',
      'The title tag is the single most impactful on-page SEO element — it is the clickable headline in every SERP and the primary keyword signal Google uses to match queries to pages.',
      'Add a unique <title> per page: 50–65 characters, primary keyword in the first 30 characters, separated from brand name.',
      { snippet: '<title>Primary Keyword Phrase – Brand Name</title>', reference: 'https://developers.google.com/search/docs/appearance/title-link', effort: 'low', impact: 'high' }))
  } else if (titleLen < 30) {
    checks.push(check('title', 'Title Tag', 'meta', 'warning', title,
      `Title too short (${titleLen} chars)`,
      'Short titles miss keyword opportunities and make your SERP listing less attractive compared to competitors.',
      'Expand to 50–65 characters. Add secondary keywords or brand name.',
      { snippet: `<title>${title} | Descriptive Keyword Phrase – Brand</title>`, effort: 'low', impact: 'medium' }))
  } else if (titleLen > 65) {
    checks.push(check('title', 'Title Tag', 'meta', 'warning', `${title.substring(0, 38)}…`,
      `Title too long (${titleLen} chars — truncates at ~65)`,
      'Google truncates titles beyond ~65 characters in SERPs. Your key message or brand name may be cut off.',
      'Trim to 50–65 characters. Front-load the primary keyword, move brand to the end.',
      { snippet: `<title>${title.substring(0, 58).trimEnd()} – Brand</title>`, effort: 'low', impact: 'medium' }))
  } else {
    checks.push(check('title', 'Title Tag', 'meta', 'good', title,
      `Optimal (${titleLen} chars)`,
      'Well-optimised title tags increase SERP CTR and signal topical relevance.',
      'Periodically A/B test titles via Google Search Console to optimise CTR.'))
  }

  // ── META: Description ──────────────────────────────────────────────────────
  const desc = $('meta[name="description"]').attr('content')?.trim() ?? ''
  const descLen = desc.length
  if (descLen === 0) {
    checks.push(check('description', 'Meta Description', 'meta', 'critical', 'Missing',
      'No meta description found',
      'Google often uses the meta description as the SERP snippet. Without one, it auto-generates text which may be irrelevant, lowering CTR.',
      'Write a 120–158 character description with the primary keyword and a clear call to action.',
      { snippet: '<meta name="description" content="Compelling 120–158 char summary with CTA.">', effort: 'low', impact: 'high' }))
  } else if (descLen < 70) {
    checks.push(check('description', 'Meta Description', 'meta', 'warning', desc,
      `Description too short (${descLen} chars)`,
      'Short descriptions waste SERP real estate and fail to differentiate your listing from competitors.',
      'Expand to 120–158 chars. Include the primary keyword and a unique value proposition.',
      { snippet: `<meta name="description" content="${desc} [Add value prop + CTA to reach 120–158 chars]">`, effort: 'low', impact: 'medium' }))
  } else if (descLen > 160) {
    checks.push(check('description', 'Meta Description', 'meta', 'warning', `${desc.substring(0, 32)}…`,
      `Description too long (${descLen} chars — truncates ~158)`,
      'Descriptions beyond ~158 chars are cut off with "…" in SERPs, hiding your call to action.',
      'Trim to under 158 characters. Keep the CTA and primary keyword near the start.',
      { snippet: `<meta name="description" content="${desc.substring(0, 155).trimEnd()}">`, effort: 'low', impact: 'medium' }))
  } else {
    checks.push(check('description', 'Meta Description', 'meta', 'good', `${desc.substring(0, 42)}…`,
      `Well-optimised (${descLen} chars)`,
      'A strong meta description improves SERP click-through rates.',
      'A/B test descriptions in Search Console. Include secondary keywords naturally.'))
  }

  // ── META: Canonical ────────────────────────────────────────────────────────
  const canonical = $('link[rel="canonical"]').attr('href')?.trim() ?? ''
  const cleanPageUrl = urlStr.replace(/\/$/, '')
  const cleanCanon = canonical.replace(/\/$/, '')

  if (!canonical) {
    checks.push(check('canonical', 'Canonical URL', 'meta', 'warning', 'Missing',
      'No canonical tag found',
      'Without canonicals, search engines may index multiple URL variants (www vs non-www, trailing slash, query parameters), splitting link equity across duplicates.',
      'Add a self-referencing canonical tag to every indexable page.',
      { snippet: `<link rel="canonical" href="${urlStr}">`, reference: 'https://developers.google.com/search/docs/crawling-indexing/canonicalization', effort: 'low', impact: 'medium' }))
  } else if (cleanCanon !== cleanPageUrl) {
    checks.push(check('canonical', 'Canonical URL', 'meta', 'warning', canonical,
      'Canonical points to a different URL',
      'A cross-page canonical tells Google to attribute all ranking signals to another URL, effectively removing this page from competitive ranking consideration.',
      'Verify the canonical target is intentional. If this page should rank independently, update it to self-reference.',
      { snippet: `<link rel="canonical" href="${urlStr}">`, effort: 'low', impact: 'high' }))
  } else {
    checks.push(check('canonical', 'Canonical URL', 'meta', 'good', canonical,
      'Valid self-referencing canonical',
      'Self-canonical prevents duplicate content dilution and consolidates link equity.',
      'Ensure all inbound links point to the canonical URL to avoid PageRank fragmentation.'))
  }

  // ── META: Robots ───────────────────────────────────────────────────────────
  const robotsMeta = $('meta[name="robots"]').attr('content')?.toLowerCase() ?? ''
  const xRobotsHeader = (responseHeaders['x-robots-tag'] ?? '').toLowerCase()
  const robotsCombined = `${robotsMeta} ${xRobotsHeader}`.trim()

  if (robotsCombined.includes('noindex')) {
    checks.push(check('meta-robots', 'Meta Robots', 'meta', 'critical',
      robotsCombined || robotsMeta,
      'Page is noindex — excluded from search results',
      'noindex completely removes the page from Google\'s index. If applied to important landing pages by mistake, all organic traffic to this page is lost.',
      'Remove the noindex directive. Check both <meta name="robots"> and the X-Robots-Tag HTTP response header.',
      { snippet: '<!-- Remove or change to: -->\n<meta name="robots" content="index, follow">', effort: 'low', impact: 'high' }))
  } else if (robotsCombined.includes('nofollow')) {
    checks.push(check('meta-robots', 'Meta Robots', 'meta', 'warning', robotsCombined,
      'Page-level nofollow blocks all link equity flow',
      'A page-level nofollow prevents PageRank from passing through any links on this page, including internal links to other important pages.',
      'Apply rel="nofollow" to individual links rather than using the page-level meta robots directive.',
      { snippet: '<a href="/page" rel="nofollow">Specific link</a>', effort: 'low', impact: 'medium' }))
  } else {
    checks.push(check('meta-robots', 'Meta Robots', 'meta', 'good',
      robotsCombined || 'Default (index, follow)',
      'No indexing restrictions detected',
      'Page is crawlable and all links pass PageRank by default.',
      'Review robots directives before any major site migration or launch.'))
  }

  // ── META: URL Structure ────────────────────────────────────────────────────
  const hasUppercase = /[A-Z]/.test(path)
  const hasUnderscores = /_/.test(path)
  const hasSpecialChars = /[^a-z0-9\-\/\.]/.test(path)
  const urlDepth = path.split('/').filter(Boolean).length

  const urlIssues = [
    hasUppercase && 'uppercase letters',
    hasUnderscores && 'underscores (use hyphens)',
    hasSpecialChars && 'special characters',
  ].filter(Boolean) as string[]

  if (urlIssues.length > 0) {
    checks.push(check('url-structure', 'URL Structure', 'meta', 'warning', path,
      `URL contains: ${urlIssues.join(', ')}`,
      'Non-canonical URL formats cause duplicate content and split link equity between variants. Google also treats underscores as word-joiners, not word-separators, so under_score becomes underscore.',
      'Use lowercase letters, hyphens, and forward slashes only. Implement 301 redirects from old URLs.',
      { snippet: '<!-- Bad -->\n/My_Product_Page\n/Category/SUB_CATEGORY\n\n<!-- Good -->\n/my-product-page\n/category/sub-category', effort: 'medium', impact: 'medium' }))
  } else if (urlDepth > 4) {
    checks.push(check('url-structure', 'URL Structure', 'meta', 'warning', path,
      `Deep URL nesting (${urlDepth} levels)`,
      'URLs more than 4 levels deep receive less crawl budget and may receive lower priority in Google\'s index.',
      'Flatten your URL architecture. Important pages should be reachable within 3 clicks from the homepage.',
      { effort: 'high', impact: 'low' }))
  } else {
    checks.push(check('url-structure', 'URL Structure', 'meta', 'good', path,
      'Clean, SEO-friendly URL',
      'Descriptive hyphenated URLs aid crawling and serve as anchor text when shared as bare links.',
      'Keep URLs short (3–5 words), descriptive, and keyword-rich.'))
  }

  // ── META: Keyword in URL ───────────────────────────────────────────────────
  if (path !== '/') {
    const titleKws = title.toLowerCase().split(/\s+/).filter(w => w.length > 4)
    const urlHasKw = titleKws.some(w => path.toLowerCase().includes(w))
    if (!urlHasKw && title) {
      checks.push(check('url-keywords', 'Keyword in URL', 'meta', 'warning', path,
        'Primary keyword not found in URL slug',
        'Keyword-rich URLs provide a lightweight ranking signal and improve SERP CTR because users can see the topic from the URL alone.',
        'Include the primary keyword in the URL slug using hyphens.',
        { snippet: '<!-- Before: /p?id=42 or /post-1 -->\n<!-- After: /primary-keyword-phrase -->', effort: 'medium', impact: 'low' }))
    } else {
      checks.push(check('url-keywords', 'Keyword in URL', 'meta', 'good', path,
        'URL contains relevant keyword(s)',
        'Keyword-present URLs correlate with better SERP CTR.',
        'Keep the slug concise — 3 to 5 words is ideal.'))
    }
  }

  // ── CONTENT: H1 ────────────────────────────────────────────────────────────
  const h1Els = $('h1')
  const h1Count = h1Els.length
  const h1Text = h1Els.first().text().trim()

  if (h1Count === 0) {
    checks.push(check('h1', 'H1 Heading', 'content', 'critical', 'Missing',
      'No H1 tag found',
      'The H1 is Google\'s clearest signal for a page\'s primary topic. Without it, the algorithm must infer the topic from other signals — weakening keyword relevance.',
      'Add exactly one H1 near the top of the main content, containing the primary keyword.',
      { snippet: '<h1>Your Primary Keyword Phrase</h1>', effort: 'low', impact: 'high' }))
  } else if (h1Count > 1) {
    checks.push(check('h1', 'H1 Heading', 'content', 'warning', `${h1Count} H1 tags`,
      `${h1Count} H1 tags found — only one recommended`,
      'Multiple H1s create conflicting topic signals and dilute the page\'s primary keyword focus.',
      'Keep one H1. Convert additional H1s to H2 or H3 subheadings.',
      { snippet: '<h1>Main Topic</h1>\n<h2>Subtopic A</h2>\n<h2>Subtopic B</h2>', effort: 'low', impact: 'medium' }))
  } else if (h1Text.length > 70) {
    checks.push(check('h1', 'H1 Heading', 'content', 'warning', `${h1Text.substring(0, 40)}…`,
      `H1 is very long (${h1Text.length} chars)`,
      'Very long H1s are hard for users to scan and may dilute keyword focus.',
      'Keep the H1 under 70 characters. Lead with the primary keyword.',
      { effort: 'low', impact: 'low' }))
  } else {
    checks.push(check('h1', 'H1 Heading', 'content', 'good',
      h1Text.length > 50 ? `${h1Text.substring(0, 50)}…` : h1Text,
      'Single, well-sized H1',
      'Clear H1 establishes the page topic for users and search engines.',
      'Ensure the H1 keyword matches or closely mirrors the title tag.'))
  }

  // ── CONTENT: Heading Hierarchy ─────────────────────────────────────────────
  const h2Count = $('h2').length
  const h3Count = $('h3').length
  const h4Count = $('h4').length
  const skippedLevels = (h1Count > 0 && h3Count > 0 && h2Count === 0)
    || (h2Count > 0 && h4Count > 0 && h3Count === 0)

  if (skippedLevels) {
    checks.push(check('heading-hierarchy', 'Heading Hierarchy', 'content', 'warning',
      `H1:${h1Count} H2:${h2Count} H3:${h3Count} H4:${h4Count}`,
      'Heading levels are skipped in the document outline',
      'Skipped heading levels (e.g. H1 → H3) break the document outline, hurt screen-reader navigation, and confuse Google\'s understanding of content hierarchy and related subtopics.',
      'Ensure headings follow strict nesting: H1 → H2 → H3. Never skip a level.',
      { reference: 'https://www.w3.org/WAI/tutorials/page-structure/headings/', wcag: '1.3.1 Level A', effort: 'low', impact: 'medium' }))
  } else if (h2Count === 0 && h1Count > 0) {
    checks.push(check('heading-hierarchy', 'Heading Hierarchy', 'content', 'warning',
      `H1:${h1Count} H2:0`,
      'No H2 subheadings — content lacks semantic structure',
      'Without H2s, long-form content has no semantic sections. Crawlers struggle to identify subtopics for indexing, and users cannot scan the page structure.',
      'Add H2 subheadings every 200–300 words, each containing a secondary or LSI keyword.',
      { effort: 'low', impact: 'medium' }))
  } else {
    checks.push(check('heading-hierarchy', 'Heading Hierarchy', 'content', 'good',
      `H1:${h1Count} H2:${h2Count} H3:${h3Count}`,
      'Logical heading structure',
      'Proper heading hierarchy aids accessibility and Google\'s topic modelling.',
      'Front-load secondary keywords in H2s to strengthen topical coverage.'))
  }

  // ── CONTENT: Word Count ────────────────────────────────────────────────────
  const bodyClone = $('body').clone()
  bodyClone.find('script, style, noscript, svg, nav, footer, header, aside, [class*="sidebar"]').remove()
  const bodyText = bodyClone.text().replace(/\s+/g, ' ').trim()
  const wordCount = bodyText.split(' ').filter(w => w.length > 0).length

  if (wordCount < 100) {
    checks.push(check('word-count', 'Content Length', 'content', 'critical', `${wordCount} words`,
      'Critically thin content (< 100 words)',
      'Google\'s Helpful Content system downgrades pages that offer little value. Pages under 100 words rarely satisfy user search intent and almost never rank for competitive keywords.',
      'Add substantive, user-first content. Informational pages should target 800–2 000 words; service pages 300–600 words.',
      { reference: 'https://developers.google.com/search/docs/appearance/helpful-content-system', effort: 'high', impact: 'high' }))
  } else if (wordCount < 300) {
    checks.push(check('word-count', 'Content Length', 'content', 'warning', `${wordCount} words`,
      'Content may be too thin (< 300 words)',
      'While word count is not a direct ranking factor, pages under 300 words often fail to fully address search intent — the actual metric Google measures.',
      'Expand to at least 300–500 words for service/landing pages. Use Google\'s People Also Ask to find related questions to answer.',
      { effort: 'high', impact: 'high' }))
  } else {
    checks.push(check('word-count', 'Content Length', 'content', 'good', `${wordCount} words`,
      'Content length is solid',
      'Comprehensive content addresses user intent more fully and tends to rank for more keyword variants.',
      'Use Search Console to find page-2 queries and expand those content sections to improve rankings.'))
  }

  // ── CONTENT: Keyword in Intro ──────────────────────────────────────────────
  if (title && wordCount >= 100) {
    const first100 = bodyText.split(' ').slice(0, 100).join(' ').toLowerCase()
    const titleKws = title.toLowerCase().split(/\s+/).filter(w => w.length > 4)
    const kwInIntro = titleKws.some(w => first100.includes(w))
    if (!kwInIntro) {
      checks.push(check('keyword-in-intro', 'Keyword in Intro', 'content', 'warning', 'Not in first 100 words',
        'Primary keyword not found in opening content',
        'Google weighs keyword proximity to the top of the document. If the primary keyword appears deep in the page, topical relevance signals are weaker.',
        'Rewrite the opening paragraph to naturally include the primary keyword in the first 1–2 sentences.',
        { effort: 'low', impact: 'medium' }))
    } else {
      checks.push(check('keyword-in-intro', 'Keyword in Intro', 'content', 'good', 'Present',
        'Primary keyword appears in the opening content',
        'Early keyword placement reinforces topical relevance.',
        'Ensure the keyword reads naturally — avoid forced placement.'))
    }
  }

  // ── CONTENT: Readability ───────────────────────────────────────────────────
  const paraCount = $('p').length
  const hasBulletLists = $('ul li, ol li').length > 3
  if (wordCount >= 300 && paraCount < 3) {
    checks.push(check('readability', 'Readability', 'content', 'warning', `${paraCount} paragraphs`,
      'Content lacks paragraph structure',
      'Large unbroken text blocks increase bounce rate. Google\'s ranking system uses user engagement signals like dwell time, which is damaged by poor readability.',
      'Break content into 2–4 sentence paragraphs. Use H2/H3 every 200–300 words and add bullet lists for scannable information.',
      { effort: 'medium', impact: 'medium' }))
  } else {
    checks.push(check('readability', 'Readability', 'content', 'good',
      `${paraCount} paragraphs${hasBulletLists ? ', lists ✓' : ''}`,
      'Content structure looks readable',
      'Scannable content improves dwell time, a positive user-experience signal.',
      'Consider adding a TL;DR, FAQ section, or key-takeaways box to capture featured snippet opportunities.'))
  }

  // ── TECHNICAL: Doctype ─────────────────────────────────────────────────────
  const hasDoctype = html.substring(0, 200).toLowerCase().includes('<!doctype html>')
  if (!hasDoctype) {
    checks.push(check('doctype', 'Doctype Declaration', 'technical', 'warning', 'Missing',
      'Missing HTML5 DOCTYPE',
      'Without DOCTYPE, browsers render in quirks mode — a legacy compatibility mode with inconsistent CSS and JS behaviour that can break modern web features.',
      'Add <!DOCTYPE html> as the very first line of every HTML document — before any whitespace.',
      { snippet: '<!DOCTYPE html>\n<html lang="en">\n  <head>…</head>\n  <body>…</body>\n</html>', effort: 'low', impact: 'low' }))
  } else {
    checks.push(check('doctype', 'Doctype Declaration', 'technical', 'good', 'HTML5',
      'Valid HTML5 DOCTYPE',
      'Standards mode ensures consistent browser rendering.',
      'No action needed.'))
  }

  // ── TECHNICAL: Charset ─────────────────────────────────────────────────────
  const charset = $('meta[charset]').attr('charset')
    ?? $('meta[http-equiv="Content-Type"]').attr('content')
    ?? ''

  if (!charset.toLowerCase().includes('utf-8')) {
    checks.push(check('charset', 'Character Encoding', 'technical', 'warning',
      charset || 'Missing',
      charset ? 'Non-UTF-8 charset' : 'No charset declaration',
      'Without UTF-8 charset declaration, browsers may misinterpret character encoding, garbling international characters, emojis, and special symbols — harming UX across global audiences.',
      'Declare UTF-8 as the very first element inside <head>, before any other tags.',
      { snippet: '<head>\n  <meta charset="utf-8">  <!-- Must be first -->\n  <title>…</title>\n</head>', effort: 'low', impact: 'low' }))
  } else {
    checks.push(check('charset', 'Character Encoding', 'technical', 'good', 'UTF-8',
      'UTF-8 charset correctly declared',
      'UTF-8 supports all Unicode characters and is the web standard.',
      'Ensure charset meta appears before any non-ASCII content in <head>.'))
  }

  // ── TECHNICAL: Viewport ────────────────────────────────────────────────────
  const viewport = $('meta[name="viewport"]').attr('content') ?? ''
  const viewportIssues: string[] = []
  if (!viewport) {
    checks.push(check('viewport', 'Mobile Viewport', 'technical', 'critical', 'Missing',
      'No viewport meta tag',
      'Google uses mobile-first indexing. Without a viewport tag, your page is rendered at desktop width on mobile — producing a broken layout that Google will rank poorly.',
      'Add the standard viewport meta tag.',
      { snippet: '<meta name="viewport" content="width=device-width, initial-scale=1">', reference: 'https://web.dev/responsive-web-design-basics/', effort: 'low', impact: 'high' }))
  } else {
    if (!viewport.includes('width=device-width')) viewportIssues.push('missing width=device-width')
    if (viewport.includes('user-scalable=no') || viewport.includes('maximum-scale=1')) {
      viewportIssues.push('disables zoom (WCAG failure)')
    }
    if (viewportIssues.length > 0) {
      checks.push(check('viewport', 'Mobile Viewport', 'technical', 'warning', viewport,
        `Viewport issues: ${viewportIssues.join('; ')}`,
        viewportIssues.some(i => i.includes('zoom'))
          ? 'Preventing zoom fails WCAG 1.4.4 (Resize Text, Level AA) and blocks accessibility for low-vision users.'
          : 'Viewport without width=device-width may not scale correctly on all mobile devices.',
        'Use the standard viewport value without user-scalable restrictions.',
        { snippet: '<meta name="viewport" content="width=device-width, initial-scale=1">', wcag: '1.4.4 Level AA', effort: 'low', impact: 'medium' }))
    } else {
      checks.push(check('viewport', 'Mobile Viewport', 'technical', 'good', viewport,
        'Mobile viewport correctly configured',
        'Proper viewport enables Google\'s mobile-first indexing to correctly render the page.',
        'Use responsive CSS (media queries, flexbox, grid) to ensure a good mobile experience.'))
    }
  }

  // ── TECHNICAL: HTML lang ───────────────────────────────────────────────────
  const htmlLang = $('html').attr('lang') ?? ''
  if (!htmlLang) {
    checks.push(check('html-lang', 'HTML lang Attribute', 'accessibility', 'warning', 'Missing',
      'No lang attribute on <html>',
      'Without a lang attribute, screen readers default to the OS language, potentially mispronouncing content in the wrong language. It also fails WCAG 3.1.1 (Level A).',
      'Add the lang attribute to the <html> element.',
      { snippet: '<html lang="en">', wcag: '3.1.1 Level A', reference: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-page', effort: 'low', impact: 'medium' }))
  } else {
    checks.push(check('html-lang', 'HTML lang Attribute', 'accessibility', 'good', htmlLang,
      `Language declared: ${htmlLang}`,
      'Correct lang attribute enables screen readers to use the right pronunciation engine.',
      'For multilingual pages, use lang attributes on individual elements where the language changes.'))
  }

  // ── TECHNICAL: Compression ─────────────────────────────────────────────────
  const contentEncoding = responseHeaders['content-encoding'] ?? ''
  const isCompressed = /gzip|br|zstd/.test(contentEncoding)
  const htmlSizeKb = Math.round(html.length / 1024)

  if (!isCompressed && htmlSizeKb > 20) {
    checks.push(check('compression', 'HTTP Compression', 'technical', 'warning',
      `${htmlSizeKb} KB (uncompressed)`,
      'Response served without compression',
      'Uncompressed responses transfer every raw byte of HTML, CSS and JS. This directly inflates Time to First Byte (TTFB) — a Core Web Vital that impacts LCP scores and Google rankings.',
      'Enable Brotli (preferred) or gzip compression on your CDN or web server.',
      { snippet: '# Nginx\ngzip on;\ngzip_types text/html text/css application/javascript;\n\n# Or enable Brotli via CDN (Cloudflare, Vercel, etc.)\n# Next.js on Vercel enables Brotli automatically', effort: 'low', impact: 'high' }))
  } else {
    checks.push(check('compression', 'HTTP Compression', 'technical', 'good',
      isCompressed ? contentEncoding : `${htmlSizeKb} KB`,
      isCompressed ? `Compressed with ${contentEncoding}` : 'Small page — compression not critical',
      'Compression reduces transfer size and improves TTFB.',
      'Brotli typically compresses 15–25% better than gzip for text content.'))
  }

  // ── TECHNICAL: Caching Headers ─────────────────────────────────────────────
  const cacheControl = responseHeaders['cache-control'] ?? ''
  const etag = responseHeaders['etag'] ?? ''
  const lastModified = responseHeaders['last-modified'] ?? ''
  const hasRevalidation = !!etag || !!lastModified

  if (!cacheControl && !hasRevalidation) {
    checks.push(check('caching', 'Browser Caching', 'technical', 'warning', 'No cache headers',
      'No Cache-Control or revalidation headers',
      'Without caching headers, browsers re-download all assets on every visit — increasing load times for returning users and wasting server bandwidth, indirectly hurting Core Web Vitals.',
      'Set Cache-Control headers. Use long max-age with immutable for versioned assets, short max-age for HTML.',
      { snippet: '# next.config.js headers\n{\n  source: "/:all*(svg|jpg|jpeg|png|gif|ico|css|js)",\n  headers: [\n    { key: "Cache-Control", value: "public, max-age=31536000, immutable" }\n  ]\n}\n# For HTML pages:\n{ key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" }', effort: 'low', impact: 'medium' }))
  } else if (cacheControl.includes('no-store')) {
    checks.push(check('caching', 'Browser Caching', 'technical', 'warning', 'no-store',
      'Caching explicitly disabled (no-store)',
      'no-store forces a full download on every visit, degrading performance for returning users.',
      'Only use no-store for sensitive pages (checkout, admin). Use appropriate max-age for public pages.',
      { effort: 'low', impact: 'medium' }))
  } else {
    checks.push(check('caching', 'Browser Caching', 'technical', 'good',
      cacheControl || (hasRevalidation ? 'ETag/Last-Modified present' : 'Configured'),
      'Caching headers configured',
      'Proper caching reduces load times for returning visitors and lowers server load.',
      'Use stale-while-revalidate for a balance of freshness and performance.'))
  }

  // ── TECHNICAL: Page Size ───────────────────────────────────────────────────
  if (htmlSizeKb > 500) {
    checks.push(check('page-size', 'HTML Size', 'technical', 'critical', `${htmlSizeKb} KB`,
      `Very large HTML (${htmlSizeKb} KB)`,
      'Excessively large HTML documents delay TTFB and DOM parsing, negatively impacting LCP and FID — both Core Web Vitals used in Google\'s ranking algorithm.',
      'Minify HTML. Extract large inline CSS/JS to external files. Lazy-load non-critical content. Consider streaming SSR.',
      { effort: 'high', impact: 'high' }))
  } else if (htmlSizeKb > 150) {
    checks.push(check('page-size', 'HTML Size', 'technical', 'warning', `${htmlSizeKb} KB`,
      `Large HTML payload (${htmlSizeKb} KB)`,
      'Large HTML payloads slow initial page loads and can hurt Core Web Vitals.',
      'Minify HTML output and audit for large inline scripts or styles that could be externalised.',
      { effort: 'medium', impact: 'medium' }))
  } else {
    checks.push(check('page-size', 'HTML Size', 'technical', 'good', `${htmlSizeKb} KB`,
      'HTML size is reasonable',
      'A lean HTML document parses faster and improves TTFB.',
      'Monitor with Lighthouse or WebPageTest as you add features.'))
  }

  // ── PERFORMANCE: Lazy Loading ──────────────────────────────────────────────
  const allImgs = $('img')
  const imgCount = allImgs.length
  const lazyCount = allImgs.filter((_, el) => $(el).attr('loading') === 'lazy').length
  const fetchHighPriority = allImgs.filter((_, el) => $(el).attr('fetchpriority') === 'high').length

  if (imgCount > 3 && lazyCount === 0) {
    checks.push(check('lazy-loading', 'Lazy Loading', 'performance', 'warning',
      `0 / ${imgCount} images lazy`,
      'No native lazy loading on any images',
      'Without lazy loading, all images — including those far below the fold — are fetched on page load. This inflates initial payload size, hurting LCP and TTI Core Web Vitals.',
      'Add loading="lazy" to all below-the-fold images. Keep hero / LCP images as eager and add fetchpriority="high".',
      { snippet: '<!-- LCP hero image (above fold) -->\n<img src="hero.jpg" alt="…" loading="eager" fetchpriority="high" width="1200" height="630">\n\n<!-- Below fold -->\n<img src="content.jpg" alt="…" loading="lazy" width="800" height="400">', effort: 'low', impact: 'high' }))
  } else if (imgCount > 0) {
    const lcpWarning = imgCount > 3 && fetchHighPriority === 0
    checks.push(check('lazy-loading', 'Lazy Loading', 'performance',
      lcpWarning ? 'warning' : 'good',
      `${lazyCount} / ${imgCount} lazy`,
      lcpWarning
        ? 'Lazy loading present but no fetchpriority="high" on LCP image'
        : 'Lazy loading properly implemented',
      'Proper lazy loading improves LCP by reducing initial payload.',
      lcpWarning
        ? 'Add fetchpriority="high" to your hero/LCP image to ensure it loads as early as possible.'
        : 'Ensure the LCP image is never lazy loaded.',
      { snippet: '<img src="hero.jpg" alt="…" fetchpriority="high" loading="eager">', effort: 'low', impact: 'medium' }))
  }

  // ── PERFORMANCE: Render-Blocking Resources ─────────────────────────────────
  const inlineScriptCount = $('script:not([src]):not([type="application/ld+json"]):not([type="module"])').length
  const inlineStyleCount = $('style').length
  const blockingLinkCount = $('link[rel="stylesheet"]:not([media]):not([onload])').length

  const renderBlockingScore = inlineScriptCount + inlineStyleCount + (blockingLinkCount > 2 ? 1 : 0)
  if (renderBlockingScore > 5) {
    checks.push(check('render-blocking', 'Render-Blocking Resources', 'performance', 'warning',
      `${inlineScriptCount} inline scripts, ${inlineStyleCount} inline styles`,
      'Heavy inline JS/CSS may block HTML parsing',
      'Large inline scripts block browser HTML parsing. Extensive inline styles prevent Critical CSS optimisation. Both inflate FCP and LCP, which are Core Web Vitals ranking signals.',
      'Extract inline JS/CSS to external files with proper caching. Use Critical CSS for above-fold styles only. Defer or async non-critical scripts.',
      { snippet: '<!-- Defer non-critical JS -->\n<script src="app.js" defer></script>\n\n<!-- Non-blocking stylesheet -->\n<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">', effort: 'medium', impact: 'high' }))
  } else {
    checks.push(check('render-blocking', 'Render-Blocking Resources', 'performance', 'good',
      `${inlineScriptCount} inline scripts, ${inlineStyleCount} inline styles`,
      'Inline resource usage looks reasonable',
      'Minimal inline JS/CSS allows the browser to parse and render HTML faster.',
      'Audit remaining render-blocking resources with Chrome Lighthouse\'s Performance tab.'))
  }

  // ── PERFORMANCE: Resource Hints ────────────────────────────────────────────
  const preconnectCount = $('link[rel="preconnect"]').length
  const preloadCount = $('link[rel="preload"]').length
  const hasThirdParty = /fonts\.googleapis\.com|cdn\.|gtm\.js|googletagmanager|analytics|clarity\.ms|hotjar|intercom/.test(html)

  if (hasThirdParty && preconnectCount === 0) {
    checks.push(check('resource-hints', 'Resource Hints', 'performance', 'warning',
      'Third-party resources detected, no hints',
      'Third-party resources present but no preconnect/preload hints',
      'Without preconnect, the browser must complete DNS + TCP + TLS for each third-party origin before downloading resources. This sequence adds 200–500ms of latency to LCP.',
      'Add preconnect hints for critical third-party origins (fonts, analytics, CDN).',
      { snippet: '<!-- In <head>, early as possible -->\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="dns-prefetch" href="https://www.google-analytics.com">', effort: 'low', impact: 'medium' }))
  } else {
    checks.push(check('resource-hints', 'Resource Hints', 'performance',
      preconnectCount > 0 || preloadCount > 0 ? 'good' : 'good',
      `${preconnectCount} preconnect, ${preloadCount} preload`,
      preconnectCount > 0 ? 'Resource hints configured' : 'No third-party origins detected',
      'Preconnect and preload reduce latency for critical resources.',
      'Avoid over-preloading — limit to 2–3 truly critical above-fold resources.'))
  }

  // ── IMAGES: Alt Text + Dimensions ─────────────────────────────────────────
  let missingAlt = 0, missingDims = 0
  allImgs.each((_, el) => {
    const alt = $(el).attr('alt')
    const w = $(el).attr('width')
    const h = $(el).attr('height')
    if (alt === undefined) missingAlt++
    if (!w || !h) missingDims++
  })

  if (missingAlt > 0) {
    checks.push(check('img-alt', 'Image Alt Text', 'images', missingAlt > 3 ? 'critical' : 'warning',
      `${missingAlt} / ${imgCount} missing alt`,
      `${missingAlt} image(s) missing alt attribute`,
      'Missing alt attributes fail WCAG 1.1.1 (Level A) and prevent images from being indexed in Google Image Search. Screen readers skip these images entirely.',
      'Add descriptive, keyword-relevant alt text to all meaningful images. Use alt="" (empty string) for decorative images.',
      { snippet: '<!-- Meaningful image -->\n<img src="product.jpg" alt="Red leather sofa — mid-century modern design" width="800" height="600">\n\n<!-- Decorative -->\n<img src="divider.png" alt="" width="1200" height="4" role="presentation">', wcag: '1.1.1 Level A', effort: 'medium', impact: 'medium' }))
  } else if (imgCount > 3 && missingDims > imgCount * 0.5) {
    checks.push(check('img-alt', 'Image Alt Text & Dimensions', 'images', 'warning',
      `${missingDims} / ${imgCount} missing dimensions`,
      'Many images missing explicit width/height — CLS risk',
      'Missing width/height attributes cause Cumulative Layout Shift (CLS) as the browser can\'t reserve space before images load. CLS is a Core Web Vital that directly impacts Google rankings.',
      'Add explicit width and height to all <img> elements to prevent layout shift.',
      { snippet: '<img src="hero.jpg" alt="Description" width="1200" height="630">', effort: 'low', impact: 'high' }))
  } else {
    checks.push(check('img-alt', 'Image Alt Text', 'images', 'good',
      `${imgCount} images, alt text present`,
      'Image alt text properly configured',
      'Descriptive alt text improves accessibility and Google Image Search rankings.',
      'Use keyword-rich alt text for content images; empty alt for decorative ones.'))
  }

  // ── SOCIAL: Open Graph ─────────────────────────────────────────────────────
  const ogTitle = $('meta[property="og:title"]').attr('content') ?? ''
  const ogDesc = $('meta[property="og:description"]').attr('content') ?? ''
  const ogImage = $('meta[property="og:image"]').attr('content') ?? ''
  const ogType = $('meta[property="og:type"]').attr('content') ?? ''

  const missingOg = [
    !ogTitle && 'og:title',
    !ogDesc && 'og:description',
    !ogImage && 'og:image',
    !ogType && 'og:type',
  ].filter(Boolean) as string[]

  if (missingOg.length >= 2) {
    checks.push(check('og-tags', 'Open Graph Tags', 'social', 'warning',
      `Missing: ${missingOg.join(', ')}`,
      `${missingOg.length} core OG tags missing`,
      'Open Graph controls exactly how your page appears when shared on Facebook, LinkedIn, Slack, Discord, and most messaging apps. Without it, platforms select random images and text — reducing engagement and CTR.',
      'Add all four core OG tags. og:image should be 1200×630px minimum.',
      { snippet: `<meta property="og:title" content="${title || 'Page Title'}">\n<meta property="og:description" content="${desc.substring(0, 120) || 'Description'}">\n<meta property="og:image" content="https://example.com/og-image.jpg">\n<meta property="og:type" content="website">\n<meta property="og:url" content="${urlStr}">`, reference: 'https://ogp.me/', effort: 'low', impact: 'medium' }))
  } else if (missingOg.length === 1) {
    checks.push(check('og-tags', 'Open Graph Tags', 'social', 'warning',
      `Missing: ${missingOg[0]}`,
      `OG tags nearly complete — missing ${missingOg[0]}`,
      'Social previews require all four core OG tags to display reliably across every platform.',
      `Add the missing ${missingOg[0]} tag.`,
      { snippet: `<meta property="${missingOg[0]}" content="[Add value here]">`, effort: 'low', impact: 'low' }))
  } else {
    checks.push(check('og-tags', 'Open Graph Tags', 'social', 'good',
      ogImage ? `Image set, type=${ogType || '?'}` : 'Complete',
      'All core Open Graph tags present',
      'Rich social previews increase CTR from shared links.',
      'Test with Facebook\'s Sharing Debugger and LinkedIn\'s Post Inspector to verify image dimensions.'))
  }

  // ── SOCIAL: Twitter / X Cards ──────────────────────────────────────────────
  const twCard = $('meta[name="twitter:card"]').attr('content') ?? ''
  const twImage = $('meta[name="twitter:image"]').attr('content') ?? ''

  if (!twCard) {
    checks.push(check('twitter-cards', 'Twitter / X Cards', 'social', 'warning', 'Missing',
      'No twitter:card meta tag',
      'Without Twitter Card tags, X/Twitter shows plain text links without images. Visual cards receive significantly more engagement and clicks.',
      'Add Twitter Card tags. Use summary_large_image for blog posts and landing pages.',
      { snippet: '<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="Page Title">\n<meta name="twitter:description" content="Description">\n<meta name="twitter:image" content="https://example.com/tw-card.jpg">', reference: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards', effort: 'low', impact: 'low' }))
  } else if (!twImage && twCard !== 'summary') {
    checks.push(check('twitter-cards', 'Twitter / X Cards', 'social', 'warning', `card=${twCard}`,
      'Twitter card present but no image',
      'Cards without images get significantly less engagement on X/Twitter.',
      'Add twitter:image pointing to a 1200×675px image.',
      { snippet: '<meta name="twitter:image" content="https://example.com/tw-image.jpg">', effort: 'low', impact: 'low' }))
  } else {
    checks.push(check('twitter-cards', 'Twitter / X Cards', 'social', 'good', `card=${twCard}`,
      'Twitter / X Card complete',
      'Tweets linking to this page will show rich image cards.',
      'Use twitter:card="summary_large_image" for maximum visual impact on X/Twitter.'))
  }

  // ── SOCIAL: hreflang ──────────────────────────────────────────────────────
  const hreflangTags = $('link[rel="alternate"][hreflang]')
  if (hreflangTags.length > 0) {
    const hasXDefault = hreflangTags.filter((_, el) => $(el).attr('hreflang') === 'x-default').length > 0
    if (!hasXDefault) {
      checks.push(check('hreflang', 'hreflang Tags', 'meta', 'warning',
        `${hreflangTags.length} tags, no x-default`,
        'hreflang tags present but missing x-default fallback',
        'Without x-default, Google doesn\'t know which page to show users whose language isn\'t explicitly listed, potentially showing the wrong locale.',
        'Add <link rel="alternate" hreflang="x-default"> pointing to your default-language URL.',
        { snippet: '<link rel="alternate" hreflang="x-default" href="https://example.com/">', reference: 'https://developers.google.com/search/docs/specialty/international/localization', effort: 'low', impact: 'medium' }))
    } else {
      checks.push(check('hreflang', 'hreflang Tags', 'meta', 'good',
        `${hreflangTags.length} tags + x-default`,
        'hreflang with x-default correctly configured',
        'Correct hreflang prevents duplicate content issues across international versions.',
        'Validate with Google Search Console\'s International Targeting report.'))
    }
  }

  // ── ACCESSIBILITY: Skip Navigation ────────────────────────────────────────
  const hasSkipNav = $('a[href^="#"]:first').text().toLowerCase().includes('skip')
    || $('[class*="skip-"]').length > 0
    || $('a[href="#main"], a[href="#content"], a[href="#main-content"]').length > 0

  if (!hasSkipNav) {
    checks.push(check('skip-nav', 'Skip Navigation Link', 'accessibility', 'warning', 'Missing',
      'No skip-to-content link found',
      'WCAG 2.4.1 (Level A) requires a mechanism to skip repeated navigation. Without it, keyboard and screen-reader users must tab through every nav item on every page.',
      'Add a visually-hidden skip link as the very first focusable element on the page.',
      { snippet: '<!-- In layout.tsx / _document -->\n<a\n  href="#main-content"\n  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white px-4 py-2 z-50"\n>\n  Skip to main content\n</a>\n<main id="main-content">…</main>', wcag: '2.4.1 Level A', effort: 'low', impact: 'medium' }))
  } else {
    checks.push(check('skip-nav', 'Skip Navigation Link', 'accessibility', 'good', 'Present',
      'Skip navigation link found',
      'Skip links satisfy WCAG 2.4.1 and improve keyboard navigation efficiency.',
      'Ensure the skip link becomes visible on focus for sighted keyboard users using :focus styles.'))
  }

  // ── ACCESSIBILITY: Semantic HTML ───────────────────────────────────────────
  const hasMain = $('main').length > 0
  const hasNav = $('nav').length > 0
  const hasHeaderEl = $('header').length > 0
  const hasFooterEl = $('footer').length > 0
  const missingLandmarks = [
    !hasMain && '<main>',
    !hasNav && '<nav>',
    !hasHeaderEl && '<header>',
    !hasFooterEl && '<footer>',
  ].filter(Boolean) as string[]

  if (missingLandmarks.length >= 2) {
    checks.push(check('semantic-html', 'Semantic HTML Landmarks', 'accessibility', 'warning',
      `Missing: ${missingLandmarks.join(', ')}`,
      `Missing semantic landmarks: ${missingLandmarks.join(', ')}`,
      'Semantic HTML5 landmark elements let screen readers jump directly to navigation, main content, and footer. Without them, assistive technology users must navigate linearly through the entire page.',
      'Replace generic <div> containers with semantic elements.',
      { snippet: '<header>\n  <nav aria-label="Main navigation">…</nav>\n</header>\n<main id="main-content">\n  <article>…</article>\n  <aside aria-label="Related content">…</aside>\n</main>\n<footer>…</footer>', wcag: '1.3.1 Level A', effort: 'medium', impact: 'medium' }))
  } else {
    checks.push(check('semantic-html', 'Semantic HTML Landmarks', 'accessibility', 'good',
      `main:${hasMain ? '✓' : '✗'} nav:${hasNav ? '✓' : '✗'} header:${hasHeaderEl ? '✓' : '✗'} footer:${hasFooterEl ? '✓' : '✗'}`,
      'Semantic landmark elements present',
      'Semantic landmarks improve accessibility and give search engines structural signals.',
      'Add aria-label to distinguish multiple <nav> or <section> elements.'))
  }

  // ── ACCESSIBILITY: Form Labels ─────────────────────────────────────────────
  const forms = $('form')
  if (forms.length > 0) {
    const inputs = $('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])').length
    const labelledByFor = $('label[for]').length
    const ariaLabelled = $('[aria-label], [aria-labelledby], [title]').filter('input, select, textarea').length
    const unlabelled = Math.max(0, inputs - labelledByFor - ariaLabelled)

    if (unlabelled > 0) {
      checks.push(check('form-labels', 'Form Accessibility', 'accessibility', 'warning',
        `${unlabelled} / ${inputs} inputs unlabelled`,
        `${unlabelled} form input(s) lack accessible labels`,
        'Unlabelled inputs fail WCAG 1.3.1 and 4.1.2 (both Level A). Screen readers cannot announce what the field is for, making the form completely unusable for blind users.',
        'Add <label for="id"> or aria-label to every form input.',
        { snippet: '<!-- Visible label -->\n<label htmlFor="email">Email address</label>\n<input type="email" id="email" name="email" autoComplete="email" />\n\n<!-- Or aria-label for icon-only inputs -->\n<input type="search" aria-label="Search products" />', wcag: '1.3.1 Level A, 4.1.2 Level A', effort: 'medium', impact: 'medium' }))
    } else {
      checks.push(check('form-labels', 'Form Accessibility', 'accessibility', 'good',
        `${forms.length} form(s) with labels`,
        'Form inputs appear to have accessible labels',
        'Labelled inputs satisfy WCAG 1.3.1 and improve usability for all users.',
        'Also add autocomplete attributes to common fields for improved UX and accessibility.'))
    }
  }

  // ── ACCESSIBILITY: ARIA Usage ──────────────────────────────────────────────
  const ariaCount = $('[role], [aria-label], [aria-labelledby], [aria-describedby]').length
  if (ariaCount === 0 && wordCount > 200) {
    checks.push(check('aria', 'ARIA Usage', 'accessibility', 'warning', '0 ARIA attributes',
      'No ARIA roles or labels detected on a content-rich page',
      'Complex interactive components (menus, modals, tabs, accordions) require ARIA attributes to be operable by screen readers. Without them, keyboard-only and screen-reader users cannot interact with dynamic UI.',
      'Add ARIA roles and labels to interactive components. First preference: use semantic HTML with built-in ARIA semantics.',
      { snippet: '<nav aria-label="Main navigation">\n<button aria-expanded="false" aria-controls="dropdown-menu">\n  Products\n</button>\n<ul id="dropdown-menu" role="menu" hidden>…</ul>', wcag: '4.1.2 Level A', reference: 'https://www.w3.org/TR/wai-aria-1.2/', effort: 'medium', impact: 'medium' }))
  } else {
    checks.push(check('aria', 'ARIA Usage', 'accessibility',
      ariaCount > 0 ? 'good' : 'good',
      ariaCount > 0 ? `${ariaCount} ARIA attributes` : 'Semantic HTML used',
      ariaCount > 0 ? 'ARIA attributes present' : 'Semantic HTML provides implicit ARIA semantics',
      'Proper ARIA usage ensures interactive components are accessible to assistive technologies.',
      'Validate with axe DevTools or WAVE accessibility checker. Avoid redundant ARIA on native semantic elements.'))
  }

  // ── STRUCTURED DATA: Schema Markup ────────────────────────────────────────
  const schemaScripts = $('script[type="application/ld+json"]')
  if (schemaScripts.length === 0) {
    checks.push(check('schema', 'Schema Markup', 'structured-data', 'warning', 'None detected',
      'No JSON-LD structured data found',
      'Schema markup enables rich results in Google (star ratings, FAQs, breadcrumbs, event dates) which dramatically increase SERP real estate and click-through rates without ranking higher.',
      'Add JSON-LD appropriate to the page type: Organization + WebSite on homepage; Article on posts; Product on product pages; FAQPage for Q&A sections.',
      { snippet: '<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Your Company",\n  "url": "https://example.com",\n  "logo": "https://example.com/logo.png"\n}\n</script>', reference: 'https://schema.org/', effort: 'medium', impact: 'high' }))
  } else {
    let parseErrors = 0
    const schemaTypes: string[] = []

    schemaScripts.each((_, el) => {
      try {
        const raw = $(el).html() ?? ''
        const data = JSON.parse(raw)
        const types = Array.isArray(data)
          ? data.map((d: { '@type': string }) => d['@type'])
          : data['@type']
            ? [data['@type']]
            : (data['@graph'] ?? []).map((n: { '@type': string }) => n['@type'])
        schemaTypes.push(...types.filter(Boolean))
      } catch {
        parseErrors++
      }
    })

    if (parseErrors > 0) {
      checks.push(check('schema', 'Schema Markup', 'structured-data', 'warning',
        `${parseErrors} invalid JSON-LD block(s)`,
        `${parseErrors} schema block(s) contain invalid JSON`,
        'Malformed JSON-LD is silently ignored by Google. A single syntax error (trailing comma, unescaped quote) prevents all rich result eligibility for that block.',
        'Validate every schema block with the Schema Markup Validator. Common fix: remove trailing commas and escape inner quotes.',
        { reference: 'https://validator.schema.org/', effort: 'low', impact: 'high' }))
    } else {
      const typeList = [...new Set(schemaTypes)].join(', ')
      checks.push(check('schema', 'Schema Markup', 'structured-data', 'good',
        typeList.length > 55 ? `${typeList.substring(0, 55)}…` : typeList || `${schemaScripts.length} block(s)`,
        `${schemaScripts.length} valid JSON-LD block(s): ${typeList.substring(0, 40)}`,
        'Valid structured data makes pages eligible for rich results in Google Search.',
        'Test eligibility with Google\'s Rich Results Test. Expand with FAQPage, BreadcrumbList, and VideoObject where applicable.'))
    }
  }

  // ── STRUCTURED DATA: BreadcrumbList (inner pages) ──────────────────────────
  if (path !== '/') {
    const hasBreadcrumbSchema = schemaScripts.toArray().some(el => {
      try {
        const data = JSON.parse($(el).html() ?? '')
        const types = [data['@type'], ...(data['@graph'] ?? []).map((n: { '@type': string }) => n['@type'])]
        return types.includes('BreadcrumbList')
      } catch { return false }
    })

    if (!hasBreadcrumbSchema) {
      checks.push(check('breadcrumb-schema', 'Breadcrumb Schema', 'structured-data', 'warning', 'Missing',
        'No BreadcrumbList schema on inner page',
        'BreadcrumbList rich results replace the URL in SERPs with a human-readable path (e.g. Home › Category › Page), improving click appeal and page context.',
        'Add BreadcrumbList JSON-LD to all inner pages.',
        { snippet: '<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "BreadcrumbList",\n  "itemListElement": [\n    {\n      "@type": "ListItem",\n      "position": 1,\n      "name": "Home",\n      "item": "https://example.com"\n    },\n    {\n      "@type": "ListItem",\n      "position": 2,\n      "name": "Category",\n      "item": "https://example.com/category"\n    }\n  ]\n}\n</script>', effort: 'low', impact: 'medium' }))
    } else {
      checks.push(check('breadcrumb-schema', 'Breadcrumb Schema', 'structured-data', 'good', 'Present',
        'BreadcrumbList schema detected',
        'Breadcrumb rich results improve SERP appearance and convey site structure to users.',
        'Keep BreadcrumbList JSON-LD in sync with any visible breadcrumb HTML navigation.'))
    }
  }

  // ── STRUCTURED DATA: FAQ Opportunity ──────────────────────────────────────
  const hasFaqHeadings = $('h2, h3').toArray().some(el => {
    const t = $(el).text().toLowerCase()
    return t.startsWith('what') || t.startsWith('how') || t.startsWith('why') || t.startsWith('when') || t.startsWith('is ') || t.startsWith('can ')
  })
  const hasFaqSection = $('[class*="faq"], [id*="faq"]').length > 0

  const hasFaqSchema = schemaScripts.toArray().some(el => {
    try {
      const data = JSON.parse($(el).html() ?? '')
      return data['@type'] === 'FAQPage' || (data['@graph'] ?? []).some((n: { '@type': string }) => n['@type'] === 'FAQPage')
    } catch { return false }
  })

  if ((hasFaqHeadings || hasFaqSection) && !hasFaqSchema) {
    checks.push(check('faq-schema', 'FAQ Schema Opportunity', 'structured-data', 'warning',
      'FAQ content found, schema missing',
      'FAQ content detected but no FAQPage schema',
      'FAQ schema can generate expandable Q&A directly in Google SERPs, dramatically increasing SERP real estate and visibility without needing a higher ranking position.',
      'Wrap your Q&A content in FAQPage JSON-LD.',
      { snippet: '<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [{\n    "@type": "Question",\n    "name": "What is your question?",\n    "acceptedAnswer": {\n      "@type": "Answer",\n      "text": "Your full answer here."\n    }\n  }]\n}\n</script>', effort: 'low', impact: 'high' }))
  }

  // ── STRUCTURED DATA: VideoObject ────────────────────────────────────────────
  const videoCount = $('iframe[src*="youtube"], iframe[src*="vimeo"], video').length
  if (videoCount > 0) {
    const hasVideoSchema = schemaScripts.toArray().some(el => {
      try {
        const data = JSON.parse($(el).html() ?? '')
        return data['@type'] === 'VideoObject' || (data['@graph'] ?? []).some((n: { '@type': string }) => n['@type'] === 'VideoObject')
      } catch { return false }
    })
    if (!hasVideoSchema) {
      checks.push(check('video-schema', 'Video Schema', 'structured-data', 'warning',
        `${videoCount} video(s), no schema`,
        'Video content without VideoObject schema',
        'VideoObject schema makes videos eligible for Google\'s video carousel and rich video results, which appear above regular organic results and dramatically boost visibility.',
        'Add VideoObject JSON-LD for each video.',
        { snippet: '<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "VideoObject",\n  "name": "Video title",\n  "description": "Video description",\n  "thumbnailUrl": "https://example.com/thumb.jpg",\n  "uploadDate": "2025-01-01",\n  "duration": "PT5M30S",\n  "contentUrl": "https://example.com/video.mp4"\n}\n</script>', effort: 'medium', impact: 'medium' }))
    } else {
      checks.push(check('video-schema', 'Video Schema', 'structured-data', 'good',
        `${videoCount} video(s) with schema`,
        'VideoObject schema present',
        'Video schema enables Google Video carousel rich results.',
        'Include duration, contentUrl, and embedUrl for highest quality VideoObject score.'))
    }
  }

  // ── LINKS: Internal ────────────────────────────────────────────────────────
  const allLinks = $('a[href]')
  let internalCount = 0, externalCount = 0
  let genericAnchors = 0, brokenAnchors = 0, unsafeExternal = 0
  const outboundLinks: string[] = []
  const genericAnchorWords = new Set(['click here', 'here', 'read more', 'learn more', 'this', 'link', 'more', 'page', 'continue'])

  allLinks.each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const rel = $(el).attr('rel') ?? ''
    const anchorText = $(el).text().trim().toLowerCase()

    if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return
    if (href === '#' || href.startsWith('javascript:')) { brokenAnchors++; return }
    if (genericAnchorWords.has(anchorText)) genericAnchors++

    try {
      const u = new URL(href, url.origin)
      const uHost = u.hostname.replace(/^www\./, '')
      const dHost = domainUrl.hostname.replace(/^www\./, '')

      if (uHost === dHost) {
        internalCount++
        outboundLinks.push(u.href)
      } else {
        externalCount++
        const opensNewTab = $(el).attr('target') === '_blank'
        if (opensNewTab && !rel.includes('noopener') && !rel.includes('noreferrer')) {
          unsafeExternal++
        }
      }
    } catch { /* malformed href — skip */ }
  })

  if (internalCount === 0 && path !== '/') {
    checks.push(check('internal-links', 'Internal Links', 'links', 'warning', '0 internal links',
      'No internal links found on this page',
      'Internal links are the primary mechanism for passing PageRank through your site. Isolated pages cannot support the ranking of other pages and receive no support from them.',
      'Add 3–5 contextually relevant internal links using keyword-rich anchor text.',
      { snippet: '<a href="/related-page">Descriptive anchor with target keyword</a>', effort: 'medium', impact: 'medium' }))
  } else if (internalCount < 3 && wordCount > 300) {
    checks.push(check('internal-links', 'Internal Links', 'links', 'warning',
      `${internalCount} link${internalCount === 1 ? '' : 's'}`,
      `Only ${internalCount} internal link(s) for a content-rich page`,
      'Content pages with few internal links miss opportunities to distribute PageRank and guide users to related content.',
      'Aim for 5–10 contextual internal links on pages over 500 words.',
      { effort: 'low', impact: 'medium' }))
  } else {
    checks.push(check('internal-links', 'Internal Links', 'links', 'good',
      `${internalCount} links`,
      'Internal linking looks healthy',
      'Strong internal linking distributes PageRank and helps Google discover topic relationships.',
      'Use descriptive anchor text with primary and secondary keywords. Avoid generic "click here" anchors.'))
  }

  // ── LINKS: Anchor Text Quality ─────────────────────────────────────────────
  if (genericAnchors > 2) {
    checks.push(check('anchor-text', 'Anchor Text Quality', 'links', 'warning',
      `${genericAnchors} generic anchor${genericAnchors > 1 ? 's' : ''}`,
      `${genericAnchors} link(s) use generic anchor text`,
      'Generic anchor text ("click here", "read more") provides zero keyword signal to Google. Descriptive anchors tell the algorithm what the linked page is about.',
      'Replace generic anchors with descriptive keyword-rich text that describes the destination page.',
      { snippet: '<!-- ✗ Generic -->\n<a href="/seo-guide">Click here</a>\n\n<!-- ✓ Descriptive -->\n<a href="/seo-guide">Complete SEO Audit Guide for 2025</a>', effort: 'low', impact: 'medium' }))
  } else {
    checks.push(check('anchor-text', 'Anchor Text Quality', 'links', 'good',
      genericAnchors === 0 ? 'All descriptive' : `${genericAnchors} generic`,
      'Anchor text quality is good',
      'Descriptive anchor text strengthens the relevance signal for linked pages.',
      'Vary anchor text naturally — exact-match repetition can trigger over-optimisation filters.'))
  }

  // ── LINKS: External Security ───────────────────────────────────────────────
  if (unsafeExternal > 0) {
    checks.push(check('external-link-security', 'External Link Security', 'links', 'warning',
      `${unsafeExternal} / ${externalCount} unsafe`,
      `${unsafeExternal} external link(s) missing rel="noopener"`,
      'External links opening in new tabs without rel="noopener noreferrer" expose users to reverse tabnapping — a vulnerability where the linked page can manipulate the originating tab.',
      'Add rel="noopener noreferrer" to all external links that open in a new tab.',
      { snippet: '<a href="https://external.com" target="_blank" rel="noopener noreferrer">\n  External link\n</a>', effort: 'low', impact: 'low' }))
  } else if (externalCount > 0) {
    checks.push(check('external-link-security', 'External Link Security', 'links', 'good',
      `${externalCount} external links`,
      'External links use correct security rel attributes',
      'noopener/noreferrer protects users from reverse tabnapping.',
      'Link to authoritative sources to support E-E-A-T signals for your domain.'))
  }

  // ── LINKS: Placeholder Anchors ─────────────────────────────────────────────
  if (brokenAnchors > 2) {
    checks.push(check('placeholder-links', 'Placeholder Links', 'links', 'warning',
      `${brokenAnchors} placeholder link${brokenAnchors > 1 ? 's' : ''}`,
      `${brokenAnchors} link(s) use href="#" or javascript:void`,
      'Placeholder links frustrate users and waste crawl budget on non-functional anchor elements.',
      'Replace with real href values or use <button> elements for JavaScript-triggered actions.',
      { snippet: '<!-- ✗ Placeholder -->\n<a href="#">Open dialog</a>\n\n<!-- ✓ Use a button -->\n<button type="button" onClick={handleOpen}>Open dialog</button>', effort: 'low', impact: 'low' }))
  }

  // ── TECHNICAL: Favicon ─────────────────────────────────────────────────────
  const faviconLinks = $('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="shortcut icon"]')
  const hasModernFavicon = faviconLinks.filter((_, el) => {
    const href = $(el).attr('href') ?? ''
    return /\.(png|svg)$/i.test(href) || $(el).attr('rel') === 'apple-touch-icon'
  }).length > 0

  if (faviconLinks.length === 0) {
    checks.push(check('favicon', 'Favicon', 'technical', 'warning', 'Missing',
      'No favicon link tags found',
      'Favicons appear in browser tabs, bookmarks, search results on some devices, and PWA home screens. Missing them signals an unpolished site.',
      'Add a complete multi-format favicon setup.',
      { snippet: '<link rel="icon" href="/favicon.ico" sizes="32x32">\n<link rel="icon" href="/icon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n<link rel="manifest" href="/manifest.webmanifest">', effort: 'low', impact: 'low' }))
  } else if (!hasModernFavicon) {
    checks.push(check('favicon', 'Favicon', 'technical', 'warning', 'Legacy ICO only',
      'Only legacy .ico favicon — no SVG or PNG',
      'High-DPI screens and Apple devices require SVG or 180×180 PNG favicons for crisp display.',
      'Add an SVG favicon for modern browsers and an Apple touch icon.',
      { snippet: '<link rel="icon" href="/icon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">', effort: 'low', impact: 'low' }))
  } else {
    checks.push(check('favicon', 'Favicon', 'technical', 'good', 'Modern formats',
      'Favicon configured with modern formats',
      'SVG and PNG favicons display crisply across all screen densities and devices.',
      'Add a web app manifest for PWA home screen icon support.'))
  }

  return {
    url: urlStr,
    path,
    checks,
    outboundLinks: [...new Set(outboundLinks)],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN-LEVEL CHECKS  (robots.txt, sitemap, SSL, security headers, HSTS)
// ─────────────────────────────────────────────────────────────────────────────

async function runDomainChecks(
  origin: string,
  opts: Required<ScanOptions>
): Promise<CheckResult[]> {
  const checks: CheckResult[] = []

  // ── SSL ────────────────────────────────────────────────────────────────────
  if (origin.startsWith('https://')) {
    checks.push(check('ssl', 'SSL / HTTPS', 'security', 'good', 'Enabled',
      'Site is served over HTTPS',
      'HTTPS is a confirmed Google ranking signal and browser trust requirement. HTTP sites are labelled "Not Secure" in Chrome.',
      'Ensure all pages enforce HTTPS. Redirect all HTTP traffic to HTTPS with 301.'))
  } else {
    checks.push(check('ssl', 'SSL / HTTPS', 'security', 'critical', 'HTTP (insecure)',
      'Site is not using HTTPS',
      'HTTP sites are marked "Not Secure" in all modern browsers, destroying user trust instantly. Google uses HTTPS as a ranking signal — HTTP sites are systematically disadvantaged.',
      'Install a free SSL certificate (Let\'s Encrypt via Certbot or your hosting provider) and add 301 redirects from HTTP to HTTPS.',
      { snippet: '# Apache .htaccess\nRewriteEngine On\nRewriteCond %{HTTPS} off\nRewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]\n\n# Nginx\nserver {\n  listen 80;\n  return 301 https://$host$request_uri;\n}', impact: 'high', effort: 'medium' }))
  }

  // ── Robots.txt ─────────────────────────────────────────────────────────────
  const robotsRes = await fetchUrl(`${origin}/robots.txt`, opts)
  if (!robotsRes) {
    checks.push(check('robots-txt', 'Robots.txt', 'domain', 'warning', 'Missing',
      'No robots.txt at /robots.txt',
      'Without robots.txt, crawlers have no guidance on what to crawl or avoid, wasting crawl budget on admin pages, private APIs, and duplicate content.',
      'Create a robots.txt at your domain root with Allow/Disallow rules and a Sitemap reference.',
      { snippet: 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/private/\nDisallow: /checkout/\nDisallow: /account/\nSitemap: https://example.com/sitemap.xml', effort: 'low', impact: 'medium' }))
  } else {
    const rb = robotsRes.html.toLowerCase()
    // Detect accidental "Disallow: /" without any Allow: rule
    const blocksEverything = rb.includes('disallow: /') && !rb.includes('allow: /')
    const hasUserAgent = rb.includes('user-agent:')
    const hasSitemapRef = rb.includes('sitemap:')

    if (blocksEverything) {
      checks.push(check('robots-txt', 'Robots.txt', 'domain', 'critical', 'Blocks all crawling',
        'Robots.txt contains Disallow: / — all crawling blocked',
        'Disallow: / prevents every search engine crawler from indexing any page on the site. This single line completely removes your site from Google search results.',
        'Remove or narrow the Disallow: / rule. Only disallow specific sensitive paths.',
        { snippet: '# Fix: Replace blanket block with specific paths\nUser-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://example.com/sitemap.xml', impact: 'high', effort: 'low' }))
    } else if (!hasUserAgent) {
      checks.push(check('robots-txt', 'Robots.txt', 'domain', 'warning', 'Invalid format',
        'Robots.txt has no User-agent directive',
        'A robots.txt without User-agent directives is malformed and may be ignored by crawlers.',
        'Add valid User-agent and Disallow/Allow directives.',
        { snippet: 'User-agent: *\nAllow: /\nDisallow: /admin/', effort: 'low', impact: 'medium' }))
    } else {
      checks.push(check('robots-txt', 'Robots.txt', 'domain',
        hasSitemapRef ? 'good' : 'warning',
        hasSitemapRef ? 'Valid + Sitemap ref' : 'Valid, no Sitemap ref',
        hasSitemapRef
          ? 'Robots.txt is valid and references the sitemap'
          : 'Robots.txt valid but missing Sitemap directive',
        'Robots.txt correctly guides crawlers.',
        hasSitemapRef
          ? 'Audit regularly for accidentally blocked important paths.'
          : 'Add Sitemap: directive for faster indexing of new content.',
        { snippet: 'Sitemap: https://example.com/sitemap.xml', effort: 'low', impact: 'low' }))
    }
  }

  // ── XML Sitemap ────────────────────────────────────────────────────────────
  const sitemapRes = await fetchUrl(`${origin}/sitemap.xml`, opts, true)
    ?? await fetchUrl(`${origin}/sitemap_index.xml`, opts, true)
    ?? await fetchUrl(`${origin}/sitemap-index.xml`, opts, true)

  if (!sitemapRes) {
    checks.push(check('sitemap', 'XML Sitemap', 'domain', 'warning', 'Missing',
      'No sitemap.xml, sitemap_index.xml, or sitemap-index.xml found',
      'XML sitemaps accelerate discovery of all your pages, especially new content. Without one, Google relies solely on link discovery — potentially missing important but poorly-linked pages.',
      'Generate an XML sitemap and submit it to Google Search Console.',
      { snippet: '# Next.js App Router — app/sitemap.ts\nimport { MetadataRoute } from "next"\n\nexport default function sitemap(): MetadataRoute.Sitemap {\n  return [\n    { url: "https://example.com", lastModified: new Date(), changeFrequency: "monthly", priority: 1 },\n  ]\n}', reference: 'https://www.sitemaps.org/', effort: 'medium', impact: 'medium' }))
  } else {
    const urlCount = (sitemapRes.html.match(/<loc>/g) ?? []).length
    const hasLastmod = sitemapRes.html.includes('<lastmod>')
    const isIndex = sitemapRes.html.includes('<sitemapindex')

    if (urlCount === 0 && !isIndex) {
      checks.push(check('sitemap', 'XML Sitemap', 'domain', 'warning', 'Empty',
        'Sitemap found but contains no URLs',
        'An empty sitemap provides no crawling guidance and may indicate a generator misconfiguration.',
        'Check your sitemap generator. Ensure it has access to your page list and is not filtered to zero results.'))
    } else {
      const quality = [
        hasLastmod && 'lastmod ✓',
        isIndex && 'sitemap index',
      ].filter(Boolean).join(', ')
      checks.push(check('sitemap', 'XML Sitemap', 'domain', 'good',
        isIndex ? `Sitemap index found` : `${urlCount} URLs${quality ? `, ${quality}` : ''}`,
        `Sitemap found${isIndex ? ' (index format)' : ` with ${urlCount} URL(s)`}`,
        'A well-maintained sitemap ensures Google discovers and indexes all important pages promptly.',
        'Submit the sitemap in Google Search Console. Remove noindex and non-canonical URLs from the sitemap.'))
    }
  }

  // ── Security Headers (fetched from homepage) ──────────────────────────────
  const homeRes = await fetchUrl(`${origin}/`, opts)
  if (homeRes) {
    const h = homeRes.headers

    // HSTS
    const hsts = h['strict-transport-security'] ?? ''
    if (origin.startsWith('https://')) {
      if (!hsts) {
        checks.push(check('hsts', 'HSTS', 'security', 'warning', 'Missing',
          'HTTPS enabled but no Strict-Transport-Security header',
          'Without HSTS, users can still access your site via HTTP on their first visit, making them vulnerable to SSL stripping attacks. HSTS forces HTTPS for all future visits.',
          'Add the HSTS header. Start with a short max-age, test, then increase to 1 year.',
          { snippet: '# Next.js next.config.js\nheaders: [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]', reference: 'https://hstspreload.org/', effort: 'low', impact: 'medium' }))
      } else {
        const maxAge = parseInt(hsts.match(/max-age=(\d+)/)?.[1] ?? '0', 10)
        checks.push(check('hsts', 'HSTS', 'security',
          maxAge >= 31_536_000 ? 'good' : 'warning',
          hsts.substring(0, 60),
          maxAge >= 31_536_000 ? 'HSTS configured with long max-age' : `HSTS max-age is low (${maxAge}s)`,
          'HSTS forces HTTPS for all future visits.',
          maxAge >= 31_536_000
            ? 'Consider submitting to the HSTS preload list for maximum protection.'
            : 'Increase max-age to at least 31 536 000 (1 year) for preload eligibility.',
          { effort: 'low', impact: 'medium' }))
      }
    }

    // Security headers checklist
    interface SecurityHeaderDef {
      header: string
      expected?: string
      label: string
      description: string
      fix: string
      snippet: string
    }
    const securityHeaders: SecurityHeaderDef[] = [
      {
        header: 'x-content-type-options',
        expected: 'nosniff',
        label: 'X-Content-Type-Options',
        description: 'Without nosniff, browsers may execute MIME-sniffed content as a different type (e.g. a text file as JavaScript), enabling XSS attacks.',
        fix: 'Set X-Content-Type-Options: nosniff on all responses.',
        snippet: '{ key: "X-Content-Type-Options", value: "nosniff" }',
      },
      {
        header: 'x-frame-options',
        label: 'X-Frame-Options',
        description: 'Without X-Frame-Options or a frame-ancestors CSP, your site can be embedded in iframes on malicious sites (clickjacking).',
        fix: 'Set X-Frame-Options: SAMEORIGIN or use Content-Security-Policy: frame-ancestors \'self\'.',
        snippet: '{ key: "X-Frame-Options", value: "SAMEORIGIN" }',
      },
      {
        header: 'referrer-policy',
        label: 'Referrer-Policy',
        description: 'Without Referrer-Policy, the full URL (including sensitive paths) is sent as the Referer header to external sites.',
        fix: 'Set Referrer-Policy: strict-origin-when-cross-origin.',
        snippet: '{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }',
      },
      {
        header: 'permissions-policy',
        label: 'Permissions-Policy',
        description: 'Without Permissions-Policy, third-party scripts can request powerful browser features (camera, geolocation, microphone) without your explicit consent.',
        fix: 'Add Permissions-Policy restricting unused browser features.',
        snippet: '{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }',
      },
    ]

    const missingHeaders: string[] = []
    for (const def of securityHeaders) {
      const val = h[def.header] ?? ''
      // Special case: frame-ancestors in CSP counts for x-frame-options
      if (def.header === 'x-frame-options') {
        const csp = h['content-security-policy'] ?? ''
        if (!val && !csp.includes('frame-ancestors')) missingHeaders.push(def.label)
      } else if (!val) {
        missingHeaders.push(def.label)
      }
    }

    if (missingHeaders.length >= 3) {
      checks.push(check('security-headers', 'Security Headers', 'security', 'warning',
        `${missingHeaders.length} missing`,
        `Missing: ${missingHeaders.slice(0, 3).join(', ')}${missingHeaders.length > 3 ? '…' : ''}`,
        'Security headers protect users from XSS, clickjacking, MIME sniffing, and data leakage. Their absence signals poor server security hygiene.',
        'Add all recommended security headers in your Next.js next.config.js headers() function.',
        { snippet: '// next.config.js\nconst securityHeaders = [\n  { key: "X-Content-Type-Options", value: "nosniff" },\n  { key: "X-Frame-Options", value: "SAMEORIGIN" },\n  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },\n  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },\n  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },\n]\n\nmodule.exports = {\n  async headers() {\n    return [{ source: "/(.*)", headers: securityHeaders }]\n  },\n}', reference: 'https://nextjs.org/docs/app/api-reference/next-config-js/headers', effort: 'low', impact: 'medium' }))
    } else if (missingHeaders.length > 0) {
      checks.push(check('security-headers', 'Security Headers', 'security', 'warning',
        `Missing: ${missingHeaders.join(', ')}`,
        `${missingHeaders.length} security header(s) missing`,
        'Missing security headers leave users exposed to browser-based attacks.',
        `Add missing headers: ${missingHeaders.join(', ')}.`,
        { snippet: `// next.config.js headers entry\n${missingHeaders.map(h => `{ key: "${h}", value: "…" }`).join('\n')}`, effort: 'low', impact: 'low' }))
    } else {
      checks.push(check('security-headers', 'Security Headers', 'security', 'good',
        'All key headers present',
        'Security headers properly configured',
        'Strong security headers protect users and demonstrate professional server hygiene.',
        'Scan regularly at securityheaders.com. Consider adding Content-Security-Policy for maximum protection.'))
    }
  }

  return checks
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE CALCULATION
// ─────────────────────────────────────────────────────────────────────────────

const SCORE_WEIGHTS: Record<CheckStatus, number> = {
  critical: -15,
  warning: -5,
  good: 0,
}

function calculatePageScore(checks: CheckResult[]): number {
  let score = 100
  for (const c of checks) score += SCORE_WEIGHTS[c.status]
  return Math.max(0, Math.min(100, score))
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export async function scanDomain(
  domainInput: string,
  options: ScanOptions = {}
): Promise<SEOReport> {
  const startMs = Date.now()
  const opts: Required<ScanOptions> = { ...DEFAULTS, ...options }

  const rawUrl = domainInput.startsWith('http') ? domainInput : `https://${domainInput}`
  const domainUrl = new URL(rawUrl)
  const origin = domainUrl.origin

  // ── Crawl ──────────────────────────────────────────────────────────────────
  const queue: string[] = [normaliseUrl(origin + '/', origin, opts)]
  const visited = new Set<string>()
  const rawPages: RawPageResult[] = []

  while (queue.length > 0 && rawPages.length < opts.maxPages) {
    const target = queue.shift()!
    const normTarget = normaliseUrl(target, origin, opts)

    if (visited.has(normTarget)) continue
    visited.add(normTarget)

    // Skip programmatic paths
    try {
      const u = new URL(normTarget)
      if (isProgrammatic(u.pathname, u.search)) continue
    } catch { continue }

    const fetched = await fetchUrl(normTarget, opts)
    if (!fetched) continue

    // Track the final resolve URL to prevent redirect loops (e.g domain.com -> www.domain.com)
    if (fetched.finalUrl) {
      const finalNorm = normaliseUrl(fetched.finalUrl, origin, opts)
      if (finalNorm !== normTarget) {
        if (visited.has(finalNorm)) continue
        visited.add(finalNorm)
      }
    }

    // Only process HTML
    const ct = fetched.headers['content-type'] ?? ''
    if (!ct.includes('text/html')) continue

    const analysed = analysePage(fetched.finalUrl || normTarget, fetched.html, fetched.headers, domainUrl)
    rawPages.push(analysed)

    // Enqueue discovered links
    for (const link of analysed.outboundLinks) {
      const normLink = normaliseUrl(link, origin, opts)
      if (!visited.has(normLink) && !queue.includes(normLink)) {
        queue.push(normLink)
      }
    }
  }

  const pagesScanned = rawPages.length

  // ── Domain checks (run in parallel with crawl results ready) ──────────────
  const domainChecks = await runDomainChecks(origin, opts)

  // ── Aggregation ────────────────────────────────────────────────────────────
  interface AggEntry {
    label: string
    category: CheckCategory
    whyItMatters: string
    howToFix: string
    snippet?: string
    reference?: string
    wcag?: string
    effort?: 'low' | 'medium' | 'high'
    impact?: 'low' | 'medium' | 'high'
    good: number
    warning: number
    critical: number
    isDomainLevel: boolean
    pages: Array<{ path: string; status: CheckStatus; value: string; message: string }>
  }

  const aggMap = new Map<string, AggEntry>()

  // Seed with domain-level checks
  for (const dc of domainChecks) {
    aggMap.set(dc.id, {
      label: dc.label,
      category: dc.category,
      whyItMatters: dc.whyItMatters,
      howToFix: dc.howToFix,
      snippet: dc.snippet,
      reference: dc.reference,
      wcag: dc.wcag,
      effort: dc.effort,
      impact: dc.impact,
      good: dc.status === 'good' ? 1 : 0,
      warning: dc.status === 'warning' ? 1 : 0,
      critical: dc.status === 'critical' ? 1 : 0,
      isDomainLevel: true,
      pages: [],
    })
  }

  // Accumulate page checks
  for (const page of rawPages) {
    for (const c of page.checks) {
      if (!aggMap.has(c.id)) {
        aggMap.set(c.id, {
          label: c.label, category: c.category,
          whyItMatters: c.whyItMatters, howToFix: c.howToFix,
          snippet: c.snippet, reference: c.reference, wcag: c.wcag,
          effort: c.effort, impact: c.impact,
          good: 0, warning: 0, critical: 0,
          isDomainLevel: false, pages: [],
        })
      }
      const entry = aggMap.get(c.id)!
      entry[c.status]++
      entry.pages.push({ path: page.path, status: c.status, value: c.value, message: c.message })
    }
  }

  // Build final array
  const aggregatedChecks: AggregatedCheck[] = []
  let criticalCount = 0, warningCount = 0, passedCount = 0

  for (const [id, data] of aggMap.entries()) {
    const totalIssues = data.warning + data.critical
    let status: CheckStatus = 'good'
    if (data.critical > 0) status = 'critical'
    else if (data.warning > 0) status = 'warning'

    if (status === 'critical') criticalCount++
    else if (status === 'warning') warningCount++
    else passedCount++

    const domCheck = domainChecks.find(c => c.id === id)

    let currentValue: string
    let worstPage: string | undefined
    let issueText: string

    if (data.isDomainLevel && domCheck) {
      currentValue = domCheck.value
      issueText = domCheck.message
    } else if (totalIssues > 0) {
      const worst = data.pages.find(p => p.status === 'critical') ?? data.pages.find(p => p.status === 'warning')
      worstPage = worst?.path
      currentValue = worst?.value ?? `${totalIssues} issue(s)`
      issueText = `${totalIssues} / ${pagesScanned} pages: ${worst?.message ?? ''}`
      if (worst) {
        const srcPage = rawPages.find(p => p.path === worst.path)
        const srcCheck = srcPage?.checks.find(c => c.id === id)
        if (srcCheck) {
          data.howToFix = srcCheck.howToFix
          data.whyItMatters = srcCheck.whyItMatters
          if (srcCheck.snippet) data.snippet = srcCheck.snippet
        }
      }
    } else {
      currentValue = data.pages[0]?.value ?? 'Passed'
      issueText = `All ${pagesScanned} page${pagesScanned === 1 ? '' : 's'} pass`
    }

    aggregatedChecks.push({
      id,
      label: data.label,
      category: data.category,
      status,
      currentValue,
      issueCount: totalIssues,
      totalScanned: data.isDomainLevel ? 1 : pagesScanned,
      issueText,
      whyItMatters: data.whyItMatters,
      howToFix: data.howToFix,
      snippet: data.snippet,
      reference: data.reference,
      wcag: data.wcag,
      effort: data.effort,
      impact: data.impact,
      worstPage,
      pageBreakdown: data.isDomainLevel ? undefined : data.pages,
    })
  }

  // Sort: critical → warning → good, then by impact (high first), then label
  const impactOrder = { high: 0, medium: 1, low: 2, undefined: 3 }
  const statusOrder = { critical: 0, warning: 1, good: 2 }
  aggregatedChecks.sort((a, b) => {
    const sByStatus = statusOrder[a.status] - statusOrder[b.status]
    if (sByStatus !== 0) return sByStatus
    const ai = impactOrder[a.impact ?? 'undefined' as keyof typeof impactOrder]
    const bi = impactOrder[b.impact ?? 'undefined' as keyof typeof impactOrder]
    return ai - bi || a.label.localeCompare(b.label)
  })

  // Group by category
  const CATEGORIES: CheckCategory[] = [
    'meta', 'content', 'technical', 'performance',
    'social', 'accessibility', 'security',
    'links', 'images', 'structured-data', 'domain',
  ]
  const checksByCategory = Object.fromEntries(
    CATEGORIES.map(cat => [cat, aggregatedChecks.filter(c => c.category === cat)])
  ) as Record<CheckCategory, AggregatedCheck[]>

  // Page analysis
  const pageAnalysis: PageAnalysis[] = rawPages.map(p => ({
    url: p.url,
    path: p.path,
    score: calculatePageScore(p.checks),
    issuesCount: p.checks.filter(c => c.status !== 'good').length,
    checks: p.checks,
  }))

  // Top 5 priorities: critical first, then high-impact warnings
  const topPriorities = aggregatedChecks
    .filter(c => c.status !== 'good')
    .slice(0, 5)

  // Final domain score
  const avgPage = pageAnalysis.length > 0
    ? pageAnalysis.reduce((s, p) => s + p.score, 0) / pageAnalysis.length
    : 50

  let finalScore = avgPage
  for (const dc of domainChecks) {
    finalScore += SCORE_WEIGHTS[dc.status]
  }
  finalScore = Math.max(0, Math.min(100, Math.round(finalScore)))

  const summary: ScanSummary = {
    score: finalScore,
    grade: gradeFromScore(finalScore),
    criticalIssues: criticalCount,
    warningIssues: warningCount,
    passedChecks: passedCount,
    totalChecks: aggregatedChecks.length,
    topPriorities,
  }

  return {
    domain: origin,
    summary,
    pagesScanned,
    pageAnalysis,
    aggregatedChecks,
    checksByCategory,
    scannedAt: new Date().toISOString(),
    durationMs: Date.now() - startMs,
  }
}