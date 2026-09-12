# Wave 1 shipped — 2026-09-11

## Shipped

- **10-01 / 10-02 / 10-04 / 10-05** — Vitest + Playwright. `analysePage`, `runDomainChecks`, `evaluateRobotsTxt`, `evaluateLlmsTxt`, `SCORE_WEIGHTS` exported. Claim matrix in `lib/claims.ts`. CI runs `pnpm test` then build then `pnpm test:e2e`.
- **01-01** — One origin `https://seoboost.app` for metadataBase, canonical `/`, OG, sitemap, robots, Organization/WebSite. 308 from `boost-seo.vercel.app`.
- **03-02** — Fake 4.9/120 AggregateRating removed. Scanner flags rating markup without visible reviews.
- **03-01 / 04-12** — FAQPage not sold as SERP/AIO. LLM export deny-list in `lib/llm-export.ts`.
- **01-03 / 08-04** — Glossary titles, canonicals, and `href`s interpolate. `/glossary` in homepage nav.
- **01-05** — `noindex` on `/seo-audit-login`, `/sign-up`, `/dashboard`. Login stays crawlable in robots.txt.
- **03-05** — Native RSC `<script type="application/ld+json">`. No 1-item Home BreadcrumbList. Homepage-only SoftwareApplication / Organization / WebSite.
- **02-03 / 07-05** — Server H1 (not `opacity:0`). Dicebear avatars no longer `priority` / `fetchPriority="high"`.
- **02-01 honesty** — No CWV/GEO/link-graph product claims. Performance row is HTML hints.

## GEO (same wave)

- **04-02** — `ai-snippet-eligible`: `nosnippet`, `max-snippet:0`, `data-nosnippet` on main. Copy: withheld from AI Overviews / AI Mode as direct input; not a ranking penalty; not a GEO score.
- **04-03** — `ai-bots-robots`: GPTBot ≠ OAI-SearchBot; ClaudeBot ≠ Claude-SearchBot; Google-Extended ≠ Googlebot. Never recommend Disallow Googlebot.
- **04-04** — `llms-txt` optional. Missing = good / not a fail. `public/llms.txt` labeled optional; Google Search ignores it.
- **04-05** — `ai-extractable-text` on first HTML. `htmlLimitedBots` was **not** added (config did not exist; 04-05/01-10 forbid `/.* /`).
- **04-08 / 04-09** — Report section **AI search / GEO**: still SEO (indexed + snippet-eligible). GSC Generative AI impressions link. No ChatGPT scrape. Bing noarchive/nocache vs Google noarchive no-op.
- **04-12** — Prompt deny-list: no FAQPage-for-AIO, no llms.txt-for-Google, no GEO score, no Disallow Googlebot.

## Tests

- `pnpm test` — **28 passed** (claims, fixtures, GEO, dashboard noindex metadata).
- `pnpm test:e2e` — **9 passed** (`/`, `/pricing`, `/glossary`, `/glossary/canonical-tag`, login, signup, `/llms.txt`, robots, sitemap, rendered H1 + JSON-LD).
- `pnpm run build` — succeeded.

## Still open (P0 from 00, not this batch)

- **08-03** — Sitemap `<loc>` crawl seed + Pro `maxPages` > 5.
- **06-03** — `FetchResult` status / hops / soft 404s.
- **08-01** — Orphan / in-degree graph (needed before a true link-graph claim).
- **06-01** — Sitemap loc quality + honest `lastmod`.
- **02-01 / 02-04** — Actual CrUX/PSI field CWV (`lib/cwv.ts`). Marketing no longer claims it.
- **03-04 remainder** — Full 2026 required-prop table beyond BreadcrumbList / offers.price / Article dates / ratings.
- **09-08 / 04-05 dual-UA** — Googlebot vs SEOScanBot vs OAI-SearchBot / PerplexityBot fetches.

No GEO score, citation %, E-E-A-T score, or AI detector shipped.
