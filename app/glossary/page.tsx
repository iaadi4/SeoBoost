import Link from 'next/link'
import { glossaryTerms } from '@/lib/glossary-data'
import { Button } from '@/components/ui/button'
import { Metadata } from 'next'
import { JsonLd, breadcrumbList } from '@/lib/json-ld'
import { SiteFooter, SiteHeader } from '@/components/site-chrome'
import { PaperGlow } from '@/components/seo-art'
import { MarketingPhoto } from '@/components/marketing-photo'

export const metadata: Metadata = {
  title: 'SEO Glossary',
  description:
    'SEO glossary explaining essential search engine optimization terms, technical concepts, and best practices.',
  alternates: {
    canonical: '/glossary',
  },
}

export default function GlossaryIndex() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <JsonLd
        data={breadcrumbList([
          { name: 'Home', path: '/' },
          { name: 'Glossary' },
        ])}
      />
      <main id="main-content" className="relative flex-1">
        <PaperGlow />
        <section className="container relative mx-auto max-w-4xl px-4 py-20">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Glossary</span>
          </nav>
          <div className="mb-16 max-w-2xl">
            <p className="mb-4 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Learn
            </p>
            <h1 className="font-display text-4xl leading-tight tracking-[-0.03em] md:text-5xl">
              SEO glossary
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Canonicals, snippets, robots, first HTML — the terms this scanner
              actually checks. We do not invent Core Web Vitals or GEO scores.
            </p>
          </div>
          <MarketingPhoto
            src="/images/feature-ai-search.png"
            alt="Cream paper still life of a search snippet card and a torn note"
            width={1200}
            height={900}
            className="mb-16 aspect-[16/9] max-w-3xl"
            sizes="(min-width: 768px) 48rem, 100vw"
          />

          <div className="grid gap-4 md:grid-cols-2">
            {glossaryTerms.map((term) => (
              <Link
                key={term.slug}
                href={`/glossary/${term.slug}`}
                className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 transition-colors hover:bg-muted/40"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h2 className="font-display text-2xl leading-snug">{term.title}</h2>
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {term.category}
                  </span>
                </div>
                <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {term.description}
                </p>
                <span className="text-sm text-foreground underline-offset-4 group-hover:underline">
                  Read guide
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-t border-border py-20">
          <div className="container mx-auto max-w-2xl px-4 text-center">
            <h2 className="font-display text-3xl">Stop guessing. Start ranking.</h2>
            <p className="mt-4 text-muted-foreground">
              Knowing the term is step one. Run a technical audit on your site.
            </p>
            <Link href="/sign-up" className="mt-8 inline-block">
              <Button size="lg">Scan your domain for free</Button>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
