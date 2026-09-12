/** Public marketing origin for metadata, canonicals, sitemap, robots, and JSON-LD. */
export const CANONICAL_ORIGIN = 'https://boost-seo.vercel.app'

const SEOBOOST_HOST = /(^|\.)seoboost\.app$/i

export function resolveSiteOrigin(
  raw: string | undefined = process.env.NEXT_PUBLIC_APP_URL
) {
  if (!raw?.trim()) return CANONICAL_ORIGIN
  const trimmed = raw.trim().replace(/\/$/, '')
  try {
    const host = new URL(trimmed).hostname
    if (SEOBOOST_HOST.test(host)) return CANONICAL_ORIGIN
    return trimmed
  } catch {
    return CANONICAL_ORIGIN
  }
}

export const SITE_ORIGIN = resolveSiteOrigin()

/** Auth and app shells: crawlable where robots.txt allows, never indexed. */
export const NOINDEX_ROBOTS = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
} as const
