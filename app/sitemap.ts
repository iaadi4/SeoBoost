import { MetadataRoute } from 'next'
import { glossaryTerms } from '@/lib/glossary-data'
import { SITE_ORIGIN } from '@/lib/site'

/** Indexable marketing paths only. Auth, dashboard, and reports stay out. */
export const MARKETING_SITEMAP_PATHS = [
  '/',
  '/pricing',
  '/glossary',
  ...glossaryTerms.map((term) => `/glossary/${term.slug}`),
] as const

export function publicSitemapUrls(origin = SITE_ORIGIN) {
  return MARKETING_SITEMAP_PATHS.map((path) =>
    path === '/' ? origin : `${origin}${path}`
  )
}

export default function sitemap(): MetadataRoute.Sitemap {
  return publicSitemapUrls().map((url) => ({ url }))
}
