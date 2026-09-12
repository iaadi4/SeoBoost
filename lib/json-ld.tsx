import { SITE_ORIGIN } from '@/lib/site'

/** Native RSC JSON-LD. Do not use next/script for this. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}

export function organizationJsonLd(origin = SITE_ORIGIN) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SEO Boost',
    url: origin,
    logo: `${origin}/icon.png`,
    email: 'hello@seoboost.app',
    sameAs: ['https://twitter.com/seoboost'],
  }
}

export function webSiteJsonLd(origin = SITE_ORIGIN) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SEO Boost',
    alternateName: ['SeoBoost', 'boost-seo.vercel.app'],
    url: origin,
  }
}

export function softwareApplicationJsonLd(
  description: string,
  origin = SITE_ORIGIN
) {
  return {
    '@context': 'https://schema.org',
    '@type': ['SoftwareApplication', 'WebApplication'],
    name: 'SEO Boost',
    operatingSystem: 'Web',
    applicationCategory: 'BusinessApplication',
    url: origin,
    offers: {
      '@type': 'Offer',
      price: '9.00',
      priceCurrency: 'USD',
    },
    description,
  }
}

export function breadcrumbList(
  crumbs: Array<{ name: string; path?: string }>,
  origin = SITE_ORIGIN
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      ...(crumb.path ? { item: `${origin}${crumb.path}` } : {}),
    })),
  }
}
