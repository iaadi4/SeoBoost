import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { SiteFooter, SiteHeader } from '@/components/site-chrome'
import { Button } from '@/components/ui/button'
import { MarketingPhoto } from '@/components/marketing-photo'
import { HeroAnimations } from './hero-animations'
import { BentoGrid } from './bento-grid'
import {
  FEATURE_CLAIMS,
  HOBBY_BULLETS,
  PRO_BULLETS,
  SCANNER_CATEGORY_COUNT,
  SCANNER_CHECK_COUNT,
} from '@/lib/claims'
import { JsonLd, softwareApplicationJsonLd } from '@/lib/json-ld'
import { PaperGlow } from '@/components/seo-art'

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true)
    return <span className="mx-auto block h-2 w-2 rounded-full bg-index" />
  if (value === false)
    return <span className="mx-auto block h-2 w-2 rounded-full bg-border" />
  return <span className="text-sm font-medium text-foreground">{value}</span>
}

function HomeJsonLd() {
  return (
    <JsonLd
      data={softwareApplicationJsonLd(
        `HTML technical SEO audits: up to 50 pages on Hobby or 500 on Pro, ${SCANNER_CHECK_COUNT} checks across ${SCANNER_CATEGORY_COUNT} categories, A–F health score and a fix list.`
      )}
    />
  )
}

function FeatureRow({
  eyebrow,
  title,
  body,
  src,
  alt,
  reverse = false,
}: {
  eyebrow: string
  title: string
  body: string
  src: string
  alt: string
  reverse?: boolean
}) {
  return (
    <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
      <div className={reverse ? 'md:order-2' : undefined}>
        <p className="mb-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </p>
        <h3 className="font-display text-3xl leading-tight sm:text-4xl">{title}</h3>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{body}</p>
      </div>
      <MarketingPhoto
        src={src}
        alt={alt}
        width={1200}
        height={900}
        className={`aspect-[4/3] ${reverse ? 'md:order-1' : ''}`}
        sizes="(min-width: 768px) 32rem, 100vw"
      />
    </div>
  )
}

export default async function Home() {
  let user = null
  try {
    const supabase = await createClient()
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser()
    user = sessionUser
  } catch {
    user = null
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <SiteHeader signedIn={!!user} />
      <HomeJsonLd />
      <main id="main-content" className="flex-1">
        <section className="relative overflow-visible px-4 pt-24 pb-12 text-center sm:px-8">
          <PaperGlow />
          <div className="container relative mx-auto max-w-5xl">
            <HeroAnimations signedIn={!!user}>
              <p className="mb-6 text-sm text-muted-foreground">
                Sitemap-seeded crawl · 50 / 500 pages · {SCANNER_CHECK_COUNT} checks
              </p>
              <h1 className="font-display text-5xl leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[64px]">
                See what search can read on your pages
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Paste a URL. We seed from your sitemap, fetch first HTML — 50
                pages on Hobby, 500 on Pro — and return an A–F health score
                with a fix list.
              </p>
            </HeroAnimations>
          </div>
        </section>

        <section className="px-4 pb-8 sm:px-8">
          <div className="container mx-auto max-w-6xl">
            <MarketingPhoto
              src="/images/hero-product.png"
              alt="Printed cream report with a large B health grade and title, meta, canonical checks"
              width={1600}
              height={900}
              priority
              className="aspect-[16/9]"
              sizes="(min-width: 1024px) 72rem, 100vw"
            />
          </div>
        </section>

        <section id="features" className="px-4 py-24 sm:px-8">
          <div className="container mx-auto max-w-6xl space-y-28">
            <div className="max-w-2xl">
              <p className="mb-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Product
              </p>
              <h2 className="font-display text-4xl leading-tight sm:text-5xl">
                What the scan actually does
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Cheerio reads the HTML Googlebot can get without executing
                JavaScript. Hobby stops at 50 pages, Pro at 500. If we hit the
                cap, the report says so.
              </p>
            </div>

            <FeatureRow
              eyebrow="Crawl"
              title="Sitemap seed, then first HTML"
              body="Homepage plus same-origin sitemap locs, then on-page links. Titles, meta, canonicals, robots, headings, OG tags, and image alts come from that HTML — not a headless browser."
              src="/images/feature-html-crawl.png"
              alt="Laptop showing first HTML next to a printed sitemap list on cream paper"
            />
            <FeatureRow
              reverse
              eyebrow="Score"
              title="An A–F grade from those checks"
              body="The health score is a weighted roll-up of the on-page findings. Hobby includes the grade plus meta, social, and heading checks."
              src="/images/feature-health-score.png"
              alt="Cream report card with A–F letter grades and the letter B circled"
            />
            <FeatureRow
              eyebrow="AI search"
              title="Snippet and robots heuristics"
              body="Pro flags nosnippet, max-snippet:0, data-nosnippet, and training-versus-search robots rules. GPTBot is not OAI-SearchBot. A missing llms.txt is not a fail."
              src="/images/feature-ai-search.png"
              alt="Printed search snippet card with a torn nosnippet note on cream paper"
            />
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-12 max-w-2xl">
              <p className="mb-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Report
              </p>
              <h2 className="font-display text-4xl leading-tight sm:text-5xl">
                A fix list you can act on
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Hobby: score, meta, social, headings. Pro adds accessibility
                hints, HTML performance hints, security headers, JSON-LD,
                image alts, AI-search heuristics, copy-as-prompt, and PDF export.
              </p>
            </div>
            <BentoGrid />
          </div>
        </section>

        <section className="border-y border-border py-20">
          <div className="container mx-auto grid max-w-5xl grid-cols-2 gap-10 px-4 text-center md:grid-cols-4 sm:px-8">
            {[
              { value: String(SCANNER_CHECK_COUNT), label: 'Unique checks the scanner can run' },
              { value: '50/500', label: 'Page cap (Hobby / Pro)' },
              { value: String(SCANNER_CATEGORY_COUNT), label: 'Check categories' },
              { value: '$9', label: 'Pro, unlimited scans' },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-4xl text-foreground">{s.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 py-24 sm:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-14 max-w-2xl">
              <p className="mb-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                How it works
              </p>
              <h2 className="font-display text-4xl leading-tight sm:text-5xl">
                Paste a URL. Get a graded report.
              </h2>
            </div>
            <ol className="grid gap-6 md:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Paste a domain',
                  body: 'Hobby includes 3 lifetime scans. Create an account — no card. Pro is unlimited scans at $9/mo.',
                },
                {
                  step: '02',
                  title: 'We fetch the HTML',
                  body: 'Homepage plus sitemap locs, then BFS. Hobby 50 pages, Pro 500. First document only. Redirects that never return 200 are dropped today.',
                },
                {
                  step: '03',
                  title: 'Read the fix list',
                  body: 'Open the report: score, failed checks, and (on Pro) a prompt you can copy or a PDF export.',
                },
              ].map((item) => (
                <li
                  key={item.step}
                  className="rounded-3xl border border-border bg-card p-8"
                >
                  <p className="mb-6 font-mono text-xs text-muted-foreground">
                    {item.step}
                  </p>
                  <h3 className="font-display text-2xl">{item.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="pricing" className="px-4 py-24 sm:px-8">
          <div className="container mx-auto max-w-5xl">
            <div className="mb-14 max-w-xl">
              <p className="mb-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Pricing
              </p>
              <h2 className="font-display text-4xl leading-tight sm:text-5xl">
                3 free scans. Pro is $9/mo.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Hobby crawls up to 50 pages. Pro crawls up to 500 and unlocks
                extra check groups and exports.
              </p>
            </div>

            <div className="mx-auto mb-12 grid max-w-3xl gap-4 md:grid-cols-2">
              <div className="flex flex-col rounded-3xl border border-border bg-card p-8">
                <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Hobby
                </p>
                <div className="mb-1 flex items-end gap-1">
                  <span className="font-display text-5xl">$0</span>
                  <span className="mb-1 text-muted-foreground">forever</span>
                </div>
                <p className="mb-6 text-sm text-muted-foreground">
                  3 total scans — no credit card
                </p>
                <ul className="mb-8 flex-1 space-y-2.5 text-sm">
                  {HOBBY_BULLETS.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-index" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up" className="w-full">
                  <Button variant="outline" size="lg" className="w-full">
                    Get started free
                  </Button>
                </Link>
              </div>

              <div className="relative flex flex-col rounded-3xl border border-foreground/15 bg-card p-8">
                <p className="mb-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Pro
                </p>
                <div className="mb-1 flex items-end gap-1">
                  <span className="font-display text-5xl">$9</span>
                  <span className="mb-1 text-muted-foreground">/mo</span>
                </div>
                <p className="mb-6 text-sm text-muted-foreground">
                  Unlimited scans, up to 500 pages
                </p>
                <ul className="mb-8 flex-1 space-y-2.5 text-sm">
                  {PRO_BULLETS.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-index" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/pricing" className="w-full">
                  <Button size="lg" className="w-full">
                    Subscribe for $9/mo
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-6 py-3.5 text-left font-medium text-muted-foreground">
                      Feature
                    </th>
                    <th className="w-28 px-6 py-3.5 text-center font-medium">
                      Hobby
                    </th>
                    <th className="w-28 px-6 py-3.5 text-center font-medium">
                      Pro
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_CLAIMS.map((f) => (
                    <tr key={f.userLabel} className="border-b border-border last:border-0">
                      <td className="px-6 py-3 text-muted-foreground">{f.userLabel}</td>
                      <td className="px-6 py-3 text-center">
                        <FeatureValue value={f.free} />
                      </td>
                      <td className="px-6 py-3 text-center">
                        <FeatureValue value={f.pro} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="border-t border-border px-4 py-28 sm:px-8">
          <div className="container mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-display text-4xl leading-tight sm:text-5xl">
                Run the HTML audit on your domain
              </h2>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                Three free scans. Account required. You get a health score and
                the checks your plan includes — not a ranking promise.
              </p>
              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link href="/sign-up">
                  <Button size="lg">Create a free account</Button>
                </Link>
                <Link
                  href="/pricing"
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  or unlock Pro for $9
                </Link>
              </div>
            </div>
            <MarketingPhoto
              src="/images/story-review.png"
              alt="Hands holding a printed cream SEO report with a large B grade"
              width={1600}
              height={900}
              className="aspect-[16/9]"
              sizes="(min-width: 768px) 32rem, 100vw"
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
