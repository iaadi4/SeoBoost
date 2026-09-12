'use client'

import { MarketingPhoto } from '@/components/marketing-photo'

export function BentoGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <article className="overflow-hidden rounded-3xl border border-border bg-card md:col-span-2">
        <MarketingPhoto
          src="/images/hero-audit.png"
          alt="Cream letterpress card with a circled B health grade and Title, Canonical, H1"
          width={1600}
          height={900}
          className="rounded-none border-0 border-b border-border"
          sizes="(min-width: 768px) 42rem, 100vw"
        />
        <div className="p-8">
          <p className="mb-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Included on Hobby
          </p>
          <h3 className="font-display text-3xl leading-tight">
            Meta, social, and headings
          </h3>
          <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
            Title, description, canonical, robots, H1, heading order, Open Graph,
            and Twitter Cards — the checks every scan runs.
          </p>
        </div>
      </article>

      <article className="overflow-hidden rounded-3xl border border-border bg-card">
        <MarketingPhoto
          src="/images/feature-health-score.png"
          alt="Cream report card with A–F grades and the letter B circled"
          width={1200}
          height={900}
          className="aspect-[4/3] rounded-none border-0 border-b border-border"
          sizes="(min-width: 768px) 20rem, 100vw"
        />
        <div className="p-8">
          <p className="mb-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Score
          </p>
          <h3 className="font-display text-3xl leading-tight">A–F from HTML</h3>
          <p className="mt-3 text-base text-muted-foreground">
            Weighted on-page grade from the checks that ran.
          </p>
        </div>
      </article>

      <article className="overflow-hidden rounded-3xl border border-border bg-card">
        <MarketingPhoto
          src="/images/feature-ai-search.png"
          alt="Printed search snippet card and a torn nosnippet note on cream paper"
          width={1200}
          height={900}
          className="aspect-[4/3] rounded-none border-0 border-b border-border"
          sizes="(min-width: 768px) 20rem, 100vw"
        />
        <div className="p-8">
          <p className="mb-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Pro
          </p>
          <h3 className="font-display text-3xl leading-tight">AI search heuristics</h3>
          <p className="mt-3 text-base text-muted-foreground">
            nosnippet and bot-table warnings. A missing llms.txt is not a fail.
          </p>
        </div>
      </article>

      <article className="overflow-hidden rounded-3xl border border-border bg-card md:col-span-2">
        <MarketingPhoto
          src="/images/feature-html-crawl.png"
          alt="Laptop showing first HTML next to a printed sitemap list on cream paper"
          width={1600}
          height={900}
          className="rounded-none border-0 border-b border-border"
          sizes="(min-width: 768px) 42rem, 100vw"
        />
        <div className="p-8">
          <p className="mb-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Limits
          </p>
          <h3 className="font-display text-3xl leading-tight">
            Sitemap seed. Plan cap.
          </h3>
          <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
            Hobby 50 pages, Pro 500. Non-200 responses are dropped. No
            JavaScript render. If discovered URLs exceed the cap, the report
            says so.
          </p>
        </div>
      </article>
    </div>
  )
}
