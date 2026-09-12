import { expect, test } from '@playwright/test'
import { SCANNER_CHECK_COUNT } from '../../lib/claims'

const ORIGIN = 'https://boost-seo.vercel.app'

function first(html: string, re: RegExp) {
  return html.match(re)?.[1] ?? ''
}

function parseHead(html: string) {
  const title = first(html, /<title[^>]*>([\s\S]*?)<\/title>/i).trim()
  const canonical =
    first(html, /rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ||
    first(html, /href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)
  const robots =
    first(html, /name=["']robots["'][^>]*content=["']([^"']+)["']/i) ||
    first(html, /content=["']([^"']+)["'][^>]*name=["']robots["']/i)
  const jsonLd = /type=["']application\/ld\+json["']/i.test(html)
  const h1 = first(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)
    .replace(/<[^>]+>/g, '')
    .trim()
  return { title, canonical, robots, jsonLd, h1 }
}

test('GET / first HTML has title and boost-seo.vercel.app canonical', async ({
  request,
}) => {
  const res = await request.get('/')
  expect(res.ok()).toBeTruthy()
  const html = await res.text()
  const head = parseHead(html)

  expect(head.title.length, 'raw HTML must include <title>').toBeGreaterThan(0)
  expect(head.title).toMatch(/SEO Boost/)
  expect(head.canonical).toMatch(/^https:\/\/boost-seo\.vercel\.app\/?$/)
  expect(html).not.toContain('https://seoboost.app')
  expect(html).not.toMatch(/aggregateRating/)
  expect(html).not.toMatch(/ratingValue["']?\s*:\s*["']4\.9["']/)
  expect(head.jsonLd).toBe(true)
  expect(head.h1.length, 'first HTML must include a visible H1').toBeGreaterThan(
    0
  )
  expect(html).toContain('href="/glossary"')
  expect(html).toMatch(/50/)
  expect(html).toMatch(/500/)
  expect(html).toContain(String(SCANNER_CHECK_COUNT))
  expect(html).toMatch(/[Nn]ot Core Web Vitals/)
  expect(html).toMatch(/not a GEO score/i)
  if (/45\+/.test(html)) {
    expect(SCANNER_CHECK_COUNT).toBeGreaterThanOrEqual(45)
  }
})

test('GET /pricing first HTML uses the same origin', async ({ request }) => {
  const html = await (await request.get('/pricing')).text()
  const head = parseHead(html)
  expect(head.title).toMatch(/Pricing/)
  expect(head.canonical).toBe(`${ORIGIN}/pricing`)
  expect(html).not.toContain('https://seoboost.app')
  expect(html).not.toMatch(/"@type":\s*"FAQPage"/)
  expect(head.jsonLd).toBe(true)
  expect(html).toMatch(/\b50\b/)
  expect(html).toMatch(/\b500\b/)
  expect(html).toMatch(/50 pages/)
  expect(html).toMatch(/[Nn]ot Core Web Vitals/)
  expect(html).toMatch(/not a GEO score/i)
})

test('GET /glossary spoke hrefs interpolate', async ({ request }) => {
  const html = await (await request.get('/glossary')).text()
  const head = parseHead(html)
  expect(head.title).toMatch(/Glossary/)
  expect(head.canonical).toBe(`${ORIGIN}/glossary`)
  expect(html).toContain('href="/glossary/canonical-tag"')
  expect(html).not.toContain('/glossary/${term.slug}')
})

test('GET /glossary/canonical-tag title is not a literal ${}', async ({
  request,
}) => {
  const html = await (await request.get('/glossary/canonical-tag')).text()
  const head = parseHead(html)
  expect(head.title).toMatch(/Canonical Tag/)
  expect(head.title).not.toContain('${termData.title}')
  expect(head.canonical).toBe(`${ORIGIN}/glossary/canonical-tag`)
  expect(html).not.toContain('/glossary/${term.slug}')
  expect(html).not.toMatch(/"@type":\s*"FAQPage"/)
  expect(head.jsonLd).toBe(true)
})

test('GET /seo-audit-login is noindex and not the homepage canonical', async ({
  request,
}) => {
  const html = await (await request.get('/seo-audit-login')).text()
  const head = parseHead(html)
  expect(head.robots.toLowerCase()).toMatch(/noindex/)
  expect(head.canonical).not.toMatch(/^https:\/\/boost-seo\.vercel\.app\/?$/)
  expect(html).not.toContain('https://seoboost.app')
  expect(html).not.toMatch(/"@type":\s*"SoftwareApplication"/)
})

test('GET /sign-up is noindex', async ({ request }) => {
  const html = await (await request.get('/sign-up')).text()
  const head = parseHead(html)
  expect(head.robots.toLowerCase()).toMatch(/noindex/)
})

test('GET /llms.txt is optional and not sold as ranking', async ({
  request,
}) => {
  const res = await request.get('/llms.txt')
  expect(res.ok()).toBeTruthy()
  const body = await res.text()
  expect(body).toMatch(/optional/i)
  expect(body).toMatch(/Google Search[\s\S]*ignores/i)
  expect(body).toMatch(/not a ranking factor/i)
})

test('GET /robots.txt and /sitemap.xml share boost-seo.vercel.app', async ({
  request,
}) => {
  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toMatch(
    /Sitemap:\s*https:\/\/boost-seo\.vercel\.app\/sitemap\.xml/
  )
  expect(robots).toMatch(/Disallow:\s*\/dashboard/)
  expect(robots).not.toMatch(/Disallow:\s*\/seo-audit-login/)

  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).toContain('https://boost-seo.vercel.app/pricing')
  expect(sitemap).toContain(
    'https://boost-seo.vercel.app/glossary/canonical-tag'
  )
  expect(sitemap).not.toContain('https://seoboost.app')
  expect(sitemap).not.toContain('/dashboard')
})

test('rendered / still has H1 and first-HTML JSON-LD', async ({ page, request }) => {
  const raw = await (await request.get('/')).text()
  expect(raw).toMatch(/application\/ld\+json/)

  await page.goto('/')
  const h1 = page.locator('h1')
  await expect(h1).toBeVisible()
  await expect(h1).toContainText('Technical SEO Audit')
  const live = await page.content()
  expect(live).toMatch(/application\/ld\+json/)
})
