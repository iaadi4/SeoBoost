import { describe, expect, it } from 'vitest'
import robots from '@/app/robots'
import sitemap, { publicSitemapUrls } from '@/app/sitemap'
import { APEX_HOST_REDIRECTS } from '@/next.config'
import {
  breadcrumbList,
  organizationJsonLd,
  softwareApplicationJsonLd,
  webSiteJsonLd,
} from '@/lib/json-ld'
import {
  CANONICAL_ORIGIN,
  NOINDEX_ROBOTS,
  resolveSiteOrigin,
  SITE_ORIGIN,
} from '@/lib/site'

describe('SITE_ORIGIN', () => {
  it('never treats seoboost.app as the public site origin', () => {
    expect(SITE_ORIGIN).not.toMatch(/seoboost\.app/)
    expect(SITE_ORIGIN).toBe(CANONICAL_ORIGIN)
    expect(resolveSiteOrigin('https://seoboost.app')).toBe(CANONICAL_ORIGIN)
    expect(resolveSiteOrigin('https://www.seoboost.app/')).toBe(CANONICAL_ORIGIN)
    expect(resolveSiteOrigin('https://preview.example.com')).toBe(
      'https://preview.example.com'
    )
    expect(SITE_ORIGIN).not.toMatch(/\/$/)
    expect(SITE_ORIGIN).toMatch(/^https:\/\//)
  })

  it('defaults to boost-seo.vercel.app when NEXT_PUBLIC_APP_URL is unset', () => {
    expect(resolveSiteOrigin(undefined)).toBe('https://boost-seo.vercel.app')
  })

  it('robots sitemap and JSON-LD breadcrumbs share that origin', () => {
    const rules = robots()
    expect(rules.sitemap).toBe(`${SITE_ORIGIN}/sitemap.xml`)
    expect(rules.sitemap).not.toMatch(/seoboost\.app/)
    expect(rules.host).toBe(SITE_ORIGIN)
    expect(JSON.stringify(rules.rules)).toMatch(/\/dashboard/)
    expect(JSON.stringify(rules.rules)).not.toMatch(/seo-audit-login/)

    const urls = publicSitemapUrls()
    expect(urls).toEqual(sitemap().map((entry) => entry.url))
    expect(urls).toContain(SITE_ORIGIN)
    expect(urls).toContain(`${SITE_ORIGIN}/pricing`)
    expect(urls).toContain(`${SITE_ORIGIN}/glossary`)
    expect(urls).toContain(`${SITE_ORIGIN}/glossary/canonical-tag`)
    expect(urls.every((url) => url.startsWith(SITE_ORIGIN))).toBe(true)
    expect(urls.join(' ')).not.toMatch(/seoboost\.app/)
    expect(
      urls.some((url) =>
        /\/(dashboard|seo-audit-login|sign-up|forgot-password|reset-password|api)\b/.test(
          url
        )
      )
    ).toBe(false)

    const crumbs = breadcrumbList([
      { name: 'Home', path: '/' },
      { name: 'Pricing', path: '/pricing' },
    ])
    expect(crumbs.itemListElement[1]).toMatchObject({
      position: 2,
      item: `${SITE_ORIGIN}/pricing`,
    })
  })

  it('JSON-LD helpers stay on the public origin and omit fake ratings', () => {
    const blob = JSON.stringify([
      organizationJsonLd(),
      webSiteJsonLd(),
      softwareApplicationJsonLd('HTML technical SEO audits'),
    ])
    expect(blob).toContain(SITE_ORIGIN)
    expect(blob).not.toMatch(/aggregateRating/i)
    expect(blob).not.toMatch(/ratingValue/)
    expect(NOINDEX_ROBOTS).toMatchObject({ index: false, follow: false })
  })

  it('308s seoboost.app onto the Vercel host and never the reverse', () => {
    expect(APEX_HOST_REDIRECTS.length).toBeGreaterThan(0)
    for (const rule of APEX_HOST_REDIRECTS) {
      expect(rule.statusCode).toBe(308)
      expect(rule.destination).toMatch(/^https:\/\/boost-seo\.vercel\.app/)
      expect(JSON.stringify(rule.has)).toMatch(/seoboost\.app/)
      expect(JSON.stringify(rule.has)).not.toMatch(/boost-seo\.vercel\.app/)
    }
  })
})
