import { MetadataRoute } from 'next'
import { glossaryTerms } from '@/lib/glossary-data'
import { SITE_ORIGIN } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const glossaryRoutes = glossaryTerms.map((term) => ({
    url: `${SITE_ORIGIN}/glossary/${term.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    {
      url: SITE_ORIGIN,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_ORIGIN}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_ORIGIN}/glossary`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...glossaryRoutes,
  ]
}
