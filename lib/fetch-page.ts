import * as cheerio from 'cheerio'

/** Follow at most this many 3xx hops, then record `too_many_redirects`. */
export const MAX_REDIRECT_HOPS = 8

export type FetchFailureKind = 'timeout' | 'network' | 'too_many_redirects'

export interface FetchPageOptions {
  fetchTimeoutMs: number
  userAgent: string
  revalidate: number
  fetchRetries: number
  maxRedirectHops?: number
}

export interface FetchPageResult {
  html: string
  headers: Record<string, string>
  /** Final HTTP status, or `0` when no response arrived. */
  status: number
  finalUrl: string
  requestedUrl: string
  redirectHops: number
  /** Requested URL plus each hop target, ending at the last URL tried. */
  redirectChain: string[]
  /** 3xx status codes in hop order (same length as `redirectHops`). */
  redirectStatuses: number[]
  error?: FetchFailureKind
}

/** Subset of `CheckResult` — fetch findings only (`technical`). */
export interface FetchCheck {
  id: string
  label: string
  category: 'technical'
  status: 'good' | 'warning' | 'critical'
  value: string
  message: string
  whyItMatters: string
  howToFix: string
  effort?: 'low' | 'medium' | 'high'
  impact?: 'low' | 'medium' | 'high'
}

const SOFT_404_HEADING =
  /^(?:404(?:\s*(?:[-–|:]\s*)?(?:error|page not found|not found))?|page not found|not found|this page (?:is missing|does not exist|doesn['’]t exist)|we (?:could not|couldn['’]t) find (?:this|the) page|sorry,?(?: we (?:could not|couldn['’]t) find (?:this|the) page)?|the page you (?:requested|are looking for)(?: (?:was|is) not found)?)(?:\s*[-–|:•]\s*.{0,40})?$/i

const SOFT_404_MAX_HEADING = 70
const SOFT_404_MAX_WORDS = 90

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export function isRedirectStatus(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308
}

export function classifyFetchError(err: unknown): Exclude<FetchFailureKind, 'too_many_redirects'> {
  if (err && typeof err === 'object') {
    const name = 'name' in err ? String(err.name) : ''
    const message = 'message' in err ? String(err.message) : ''
    if (name === 'TimeoutError' || name === 'AbortError') return 'timeout'
    if (/timeout|aborted due to timeout|The operation was aborted/i.test(message)) {
      return 'timeout'
    }
  }
  return 'network'
}

function headersToRecord(headers: { forEach?: (cb: (value: string, key: string) => void) => void } | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  headers?.forEach?.((v, k) => {
    out[k.toLowerCase()] = v
  })
  return out
}

function headerGet(
  headers: { get?: (name: string) => string | null } | undefined,
  record: Record<string, string>,
  name: string
): string {
  const fromGet = headers?.get?.(name)
  if (fromGet) return fromGet
  return record[name.toLowerCase()] ?? ''
}

async function readBody(res: { text: () => Promise<string> }): Promise<string> {
  try {
    return await res.text()
  } catch {
    return ''
  }
}

function emptyResult(url: string, error: FetchFailureKind): FetchPageResult {
  return {
    html: '',
    headers: {},
    status: 0,
    finalUrl: url,
    requestedUrl: url,
    redirectHops: 0,
    redirectChain: [url],
    redirectStatuses: [],
    error,
  }
}

function hostKey(urlStr: string): string {
  try {
    return new URL(urlStr).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

function formatChain(chain: string[]): string {
  if (chain.length === 0) return ''
  const hosts = new Set(chain.map(hostKey).filter(Boolean))
  const multiHost = hosts.size > 1
  return chain
    .map((u) => {
      try {
        const x = new URL(u)
        const path = `${x.pathname}${x.search}` || '/'
        return multiHost ? `${x.hostname}${path}` : path
      } catch {
        return u
      }
    })
    .join(' → ')
}

function visibleWordCount(html: string): number {
  const $ = cheerio.load(html)
  $('script, style, noscript, svg, template').remove()
  const text = $('body').text().replace(/\s+/g, ' ').trim()
  if (!text) return 0
  return text.split(/\s+/).filter((w) => /[a-zA-Z\d]/.test(w)).length
}

function headingLooksMissing(text: string): boolean {
  const t = text.replace(/\s+/g, ' ').trim()
  if (!t || t.length > SOFT_404_MAX_HEADING) return false
  return SOFT_404_HEADING.test(t)
}

/**
 * Conservative soft-404: HTTP 200 plus a short, boilerplate “not found”
 * title/H1. Real short pages without that heading are not flagged.
 */
export function detectSoft404(html: string, status: number): boolean {
  if (status !== 200 || !html.trim()) return false
  const $ = cheerio.load(html)
  const title = $('title').first().text()
  const h1 = $('h1').first().text()
  if (!headingLooksMissing(title) && !headingLooksMissing(h1)) return false
  return visibleWordCount(html) < SOFT_404_MAX_WORDS
}

export function isHtmlResponse(contentType: string | undefined, html: string): boolean {
  const ct = (contentType ?? '').toLowerCase()
  if (ct.includes('text/html') || ct.includes('application/xhtml')) return true
  if (ct && !ct.startsWith('text/plain')) return false
  return /^\s*</.test(html)
}

async function fetchOnce(
  url: string,
  opts: FetchPageOptions,
  acceptXml: boolean,
  maxHops: number
): Promise<FetchPageResult> {
  const chain = [url]
  const redirectStatuses: number[] = []
  let current = url
  let hops = 0

  while (true) {
    let res: Response
    try {
      res = await fetch(current, {
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
        redirect: 'manual',
        signal: AbortSignal.timeout(opts.fetchTimeoutMs),
        next: { revalidate: opts.revalidate },
      })
    } catch (err) {
      return {
        html: '',
        headers: {},
        status: 0,
        finalUrl: current,
        requestedUrl: url,
        redirectHops: hops,
        redirectChain: chain,
        redirectStatuses,
        error: classifyFetchError(err),
      }
    }

    const headers = headersToRecord(res.headers)
    const status = res.status

    if (isRedirectStatus(status)) {
      if (hops >= maxHops) {
        return {
          html: '',
          headers,
          status,
          finalUrl: current,
          requestedUrl: url,
          redirectHops: hops,
          redirectChain: chain,
          redirectStatuses,
          error: 'too_many_redirects',
        }
      }

      const location = headerGet(res.headers, headers, 'location').trim()
      if (!location) {
        const html = await readBody(res)
        return {
          html,
          headers,
          status,
          finalUrl: current,
          requestedUrl: url,
          redirectHops: hops,
          redirectChain: chain,
          redirectStatuses,
        }
      }

      let nextUrl: string
      try {
        nextUrl = new URL(location, current).href
      } catch {
        const html = await readBody(res)
        return {
          html,
          headers,
          status,
          finalUrl: current,
          requestedUrl: url,
          redirectHops: hops,
          redirectChain: chain,
          redirectStatuses,
        }
      }

      hops += 1
      redirectStatuses.push(status)
      chain.push(nextUrl)

      if (chain.indexOf(nextUrl) !== chain.length - 1) {
        return {
          html: '',
          headers,
          status,
          finalUrl: nextUrl,
          requestedUrl: url,
          redirectHops: hops,
          redirectChain: chain,
          redirectStatuses,
          error: 'too_many_redirects',
        }
      }

      current = nextUrl
      continue
    }

    const html = await readBody(res)
    return {
      html,
      headers,
      status,
      finalUrl: current,
      requestedUrl: url,
      redirectHops: hops,
      redirectChain: chain,
      redirectStatuses,
    }
  }
}

/**
 * First-HTML GET with manual redirect accounting, retries on 5xx / network /
 * timeout, and an explicit error instead of a silent drop.
 */
export async function fetchPage(
  url: string,
  opts: FetchPageOptions,
  extra: { acceptXml?: boolean } = {}
): Promise<FetchPageResult> {
  const maxAttempts = 1 + Math.max(0, opts.fetchRetries)
  const maxHops = opts.maxRedirectHops ?? MAX_REDIRECT_HOPS
  const acceptXml = extra.acceptXml === true
  let last: FetchPageResult = emptyResult(url, 'network')

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await delay(500 * 2 ** (attempt - 1))
    }
    last = await fetchOnce(url, opts, acceptXml, maxHops)
    if (last.error === 'too_many_redirects') return last
    if (last.error) {
      if (attempt === maxAttempts - 1) return last
      continue
    }
    if (last.status >= 500 && attempt < maxAttempts - 1) continue
    return last
  }

  return last
}

export function buildFetchChecks(result: FetchPageResult): FetchCheck[] {
  const checks: FetchCheck[] = []
  const chainLabel = formatChain(result.redirectChain)

  if (result.error === 'timeout') {
    checks.push({
      id: 'fetch-error',
      label: 'Fetch error',
      category: 'technical',
      status: 'critical',
      value: 'Timeout',
      message: `Request timed out after hops=${result.redirectHops}`,
      whyItMatters:
        'A timeout is a page-level fetch failure. This scanner records it instead of dropping the URL. Crawlers that give up here never see the HTML.',
      howToFix:
        'Fix TTFB/server hangs for this URL, or raise the origin’s response time so a 10s HTML GET succeeds. This is not a Core Web Vitals grade.',
      effort: 'medium',
      impact: 'high',
    })
  } else if (result.error === 'network') {
    checks.push({
      id: 'fetch-error',
      label: 'Fetch error',
      category: 'technical',
      status: 'critical',
      value: 'Network error',
      message: 'No HTTP response (DNS, TLS, or connection error)',
      whyItMatters:
        'The URL never produced a status code. Silent drops hide broken hosts; this is recorded as a page issue.',
      howToFix:
        'Confirm the hostname resolves, TLS is valid, and the server accepts GET from the scanner user-agent.',
      effort: 'medium',
      impact: 'high',
    })
  } else if (result.error === 'too_many_redirects') {
    checks.push({
      id: 'fetch-error',
      label: 'Fetch error',
      category: 'technical',
      status: 'critical',
      value: `Redirect cap (${result.redirectHops} hops)`,
      message: `Stopped after ${result.redirectHops} hop(s): ${chainLabel}`,
      whyItMatters:
        'Bots cap redirect follows. A loop or long chain means the final document was never fetched.',
      howToFix:
        'Collapse the chain to a single 301/308, or fix the redirect loop.',
      effort: 'low',
      impact: 'high',
    })
  }

  if (!result.error) {
    const status = result.status
    let statusRank: FetchCheck['status'] = 'good'
    let statusMessage = `Final HTTP status ${status}`
    let why =
      'The final status after redirects is what crawlers index against. This is the response code, not a field performance metric.'
    let fix = 'Keep serving 200 for live documents. Use 301/308 for moves and 404/410 for gone URLs.'
    if (status === 0) {
      statusRank = 'critical'
      statusMessage = 'No HTTP status (no response)'
      why = 'Without a status code the URL is not a fetchable document.'
      fix = 'Restore a reachable HTTP response for this URL.'
    } else if (status >= 500) {
      statusRank = 'critical'
      statusMessage = `Final HTTP status ${status} (server error)`
      why = '5xx responses are not indexable documents. Repeated errors delay recrawl.'
      fix = 'Fix the origin error for this path. Do not leave linked/sitemap URLs on 5xx.'
    } else if (status >= 400) {
      statusRank = 'critical'
      statusMessage = `Final HTTP status ${status}`
      why =
        '4xx means this URL is not the intended document. If it is still linked or in a sitemap, crawlers waste budget here.'
      fix =
        'Restore the page, 301 to the live URL, or keep 404/410 and remove the URL from internal links and the sitemap.'
    } else if (status >= 300) {
      statusRank = 'warning'
      statusMessage = `Final HTTP status ${status} (redirect not followed)`
      why = 'A 3xx without a usable Location never reached a document.'
      fix = 'Add a valid Location header, or serve the document directly.'
    } else if (status === 204) {
      statusRank = 'warning'
      statusMessage = 'Final HTTP status 204 (no body)'
      why = '204 has no HTML for indexing or first-HTML extraction.'
      fix = 'Serve 200 with HTML for documents that should be crawled.'
    }

    checks.push({
      id: 'http-status',
      label: 'HTTP status',
      category: 'technical',
      status: statusRank,
      value: String(status),
      message: statusMessage,
      whyItMatters: why,
      howToFix: fix,
      effort: statusRank === 'good' ? 'low' : 'medium',
      impact: statusRank === 'good' ? 'low' : 'high',
    })
  }

  const hops = result.redirectHops
  const temps = result.redirectStatuses.filter((s) => s === 302 || s === 303 || s === 307)
  let hopRank: FetchCheck['status'] = 'good'
  let hopMessage = hops === 0 ? 'No redirects (0 hops)' : `${hops} redirect hop(s): ${chainLabel}`
  let hopWhy =
    'Hop count is recorded so redirect chains are visible. This is crawl accounting, not a Core Web Vitals number.'
  let hopFix = 'Prefer a single 301/308 to the final URL. Avoid hops through HTTP or off-host bounce pages.'

  if (result.error === 'too_many_redirects') {
    hopRank = 'critical'
    hopMessage = `Redirect chain capped at ${hops} hop(s): ${chainLabel}`
  } else if (hops >= 3) {
    hopRank = 'warning'
    hopMessage = `Long redirect chain (${hops} hops): ${chainLabel}`
    hopWhy = 'Each hop is another request. Long chains waste crawl budget and some bots stop early.'
    hopFix = 'Point the first URL straight at the final document with one 301 or 308.'
  } else if (hops === 2) {
    hopRank = 'warning'
    hopMessage = `Redirect chain (${hops} hops): ${chainLabel}`
    hopWhy = 'Two hops usually mean an extra bounce (HTTP→HTTPS plus a path change, or a trailing-slash hop).'
    hopFix = 'Skip the intermediate URL so clients land in one hop.'
  } else if (hops === 1 && temps.length > 0) {
    hopRank = 'warning'
    hopMessage = `Temporary redirect (${result.redirectStatuses[0]}): ${chainLabel}`
    hopWhy = '302/303/307 do not pass ranking signals as cleanly as a permanent 301/308 when the move is permanent.'
    hopFix = 'If the move is permanent, use 301 or 308.'
  }

  const requestedHost = hostKey(result.requestedUrl)
  const finalHost = hostKey(result.finalUrl)
  if (!result.error && hops > 0 && requestedHost && finalHost && requestedHost !== finalHost) {
    hopRank = hopRank === 'good' ? 'warning' : hopRank
    hopMessage = `Redirect left the crawl host (${hops} hop(s)): ${chainLabel}`
    hopWhy = 'The final URL is on another host. First-HTML analysis stays on the requested URL’s origin.'
    hopFix = 'Keep same-site moves on the crawl host, or update links to the intended origin.'
  }

  checks.push({
    id: 'redirect-chain',
    label: 'Redirect chain',
    category: 'technical',
    status: hopRank,
    value: hops === 0 ? '0 hops' : `${hops} hop${hops === 1 ? '' : 's'}`,
    message: hopMessage,
    whyItMatters: hopWhy,
    howToFix: hopFix,
    effort: 'low',
    impact: hopRank === 'good' ? 'low' : 'medium',
  })

  if (!result.error && detectSoft404(result.html, result.status)) {
    checks.push({
      id: 'soft-404',
      label: 'Soft 404',
      category: 'technical',
      status: 'warning',
      value: '200 + not-found HTML',
      message:
        'HTTP 200 with a thin, boilerplate “not found” title/H1 in the first HTML (heuristic)',
      whyItMatters:
        'Search engines may treat a 200 “not found” template as a soft 404 and not index it as a real result. This is a first-HTML heuristic, not a lab performance metric.',
      howToFix:
        'Serve a real 404/410 for missing URLs, or replace the not-found copy with a live document if the URL should exist.',
      effort: 'low',
      impact: 'high',
    })
  }

  return checks
}
