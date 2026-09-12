export type SitemapKind = 'index' | 'urlset' | 'unknown'

const LOC_RE = /<loc>\s*([^<]+?)\s*<\/loc>/gi
const NON_HTML_EXT =
  /\.(xml|json|txt|csv|css|js|mjs|ts|map|woff2?|ttf|eot|otf|ico|png|jpe?g|gif|svg|webp|avif|pdf|zip|gz|tar|br)(\?.*)?$/i

export function isSitemapIndex(xml: string): boolean {
  return /<sitemapindex[\s>]/i.test(xml)
}

export function extractLocs(xml: string): string[] {
  const locs: string[] = []
  const seen = new Set<string>()
  for (const match of xml.matchAll(LOC_RE)) {
    const raw = decodeXml(match[1].trim())
    if (!raw || seen.has(raw)) continue
    seen.add(raw)
    locs.push(raw)
  }
  return locs
}

export function parseSitemapKind(xml: string): SitemapKind {
  if (isSitemapIndex(xml)) return 'index'
  if (/<urlset[\s>]/i.test(xml)) return 'urlset'
  return 'unknown'
}

/** Same-origin HTML page URLs. Drops other hosts and asset/sitemap files. */
export function filterSameOriginHtmlLocs(locs: string[], origin: string): string[] {
  let originUrl: URL
  try {
    originUrl = new URL(origin)
  } catch {
    return []
  }
  const originHost = originUrl.hostname.replace(/^www\./, '')
  const out: string[] = []
  const seen = new Set<string>()

  for (const loc of locs) {
    let u: URL
    try {
      u = new URL(loc, origin)
    } catch {
      continue
    }
    if (u.hostname.replace(/^www\./, '') !== originHost) continue
    if (NON_HTML_EXT.test(u.pathname)) continue
    u.hash = ''
    u.hostname = originUrl.hostname
    u.protocol = originUrl.protocol
    let href = u.href
    if (href !== originUrl.origin + '/' && href !== originUrl.origin && href.endsWith('/')) {
      href = href.slice(0, -1)
    }
    if (seen.has(href)) continue
    seen.add(href)
    out.push(href)
  }
  return out
}

export function parseSitemapLocs(
  xml: string,
  origin: string
): { kind: SitemapKind; locs: string[] } {
  const kind = parseSitemapKind(xml)
  const raw = extractLocs(xml)
  if (kind === 'index') {
    return { kind, locs: raw }
  }
  return { kind, locs: filterSameOriginHtmlLocs(raw, origin) }
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}
