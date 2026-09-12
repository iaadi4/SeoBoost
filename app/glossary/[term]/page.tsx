import { notFound } from 'next/navigation'
import Link from 'next/link'
import { glossaryTerms } from '@/lib/glossary-data'
import { Button } from '@/components/ui/button'
import { Metadata } from 'next'
import { JsonLd, breadcrumbList } from '@/lib/json-ld'
import { SITE_ORIGIN } from '@/lib/site'
import { SiteFooter, SiteHeader } from '@/components/site-chrome'
import { PaperGlow } from '@/components/seo-art'

interface TermPageProps {
  params: Promise<{
    term: string
  }>
}

export async function generateMetadata({
  params,
}: TermPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const termData = glossaryTerms.find((t) => t.slug === resolvedParams.term)

  if (!termData) {
    notFound()
  }

  return {
    title: `${termData.title} | SEO Glossary`,
    description: termData.description,
    alternates: {
      canonical: `/glossary/${termData.slug}`,
    },
    openGraph: {
      title: `${termData.title} Explained`,
      description: termData.description,
      type: 'article',
      url: `/glossary/${termData.slug}`,
    },
  }
}

export async function generateStaticParams() {
  return glossaryTerms.map((term) => ({
    term: term.slug,
  }))
}

export default async function TermPage({ params }: TermPageProps) {
  const resolvedParams = await params
  const termData = glossaryTerms.find((t) => t.slug === resolvedParams.term)

  if (!termData) {
    notFound()
  }

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `What is ${termData.title}? SEO Definition & Best Practices`,
    description: termData.description,
    author: {
      '@type': 'Organization',
      name: 'SEO Boost',
      url: SITE_ORIGIN,
    },
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <JsonLd
        data={breadcrumbList([
          { name: 'Home', path: '/' },
          { name: 'Glossary', path: '/glossary' },
          { name: termData.title },
        ])}
      />
      <JsonLd data={articleJsonLd} />
      <SiteHeader />

      <main id="main-content" className="relative flex-1 py-12 md:py-20">
        <PaperGlow />
        <article className="container relative mx-auto max-w-3xl px-4">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/glossary" className="hover:text-foreground">
              Glossary
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{termData.title}</span>
          </nav>
          <Link
            href="/glossary"
            className="mb-8 inline-flex text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to glossary
          </Link>

          <header className="mb-12">
            <span className="mb-4 inline-block rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {termData.category} SEO
            </span>
            <h1 className="mb-6 font-display text-4xl leading-tight tracking-[-0.03em] md:text-6xl">
              {termData.title}
            </h1>
            <p className="text-xl leading-relaxed text-muted-foreground">
              {termData.description}
            </p>
          </header>

          <div
            className="seo-prose max-w-none"
            dangerouslySetInnerHTML={{ __html: termData.content }}
          />
        </article>

        <section className="container mx-auto mt-24 max-w-3xl border-t border-border px-4 pt-12">
          <h2 className="mb-6 font-display text-2xl">Keep learning</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {glossaryTerms
              .filter((t) => t.slug !== termData.slug)
              .slice(0, 2)
              .map((term) => (
                <Link
                  key={term.slug}
                  href={`/glossary/${term.slug}`}
                  className="rounded-3xl border border-border bg-card p-6 transition-colors hover:bg-muted/40"
                >
                  <h3 className="mb-2 font-display text-xl">{term.title}</h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {term.description}
                  </p>
                </Link>
              ))}
          </div>
        </section>

        <section className="container mx-auto mt-12 max-w-3xl px-4">
          <div className="rounded-3xl border border-border bg-card p-8 text-center sm:p-12">
            <h2 className="font-display text-2xl md:text-3xl">
              Are your {termData.title.toLowerCase()}s optimized?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Get a free technical audit and see what is holding the page back
              from ranking.
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
