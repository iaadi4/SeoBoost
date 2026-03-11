import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Zap, ArrowLeft, ArrowRight } from 'lucide-react'
import { glossaryTerms } from '@/lib/glossary-data'
import { Button } from '@/components/ui/button'
import { Metadata } from 'next'

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
    return {
      title: 'Term Not Found | SEO Boost Glossary',
    }
  }

  return {
    title: `What is \${termData.title}? | SEO Boost Glossary`,
    description: termData.description,
    alternates: {
      canonical: `/glossary/\${termData.slug}`,
    },
    openGraph: {
      title: `\${termData.title} Explained | SEO Boost`,
      description: termData.description,
      type: 'article',
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is \${termData.title} in SEO?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: termData.description,
        },
      },
    ],
  }

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `What is \${termData.title}? SEO Definition & Best Practices`,
    description: termData.description,
    author: {
      '@type': 'Organization',
      name: 'SEO Boost',
      url: 'https://seoboost.app',
    },
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-8 h-14 flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shadow-md shadow-primary/30">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base tracking-tight">
              SEO Boost
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/glossary">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Glossary Index
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-12 md:py-20">
        <article className="container mx-auto px-4 max-w-3xl">
          <Link
            href="/glossary"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Glossary
          </Link>

          <header className="mb-12">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full uppercase tracking-wider mb-4 border border-primary/20">
              {termData.category} SEO
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              {termData.title}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {termData.description}
            </p>
          </header>

          <div
            className="prose prose-lg dark:prose-invert max-w-none 
              prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-6 
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-ul:text-muted-foreground prose-ul:my-6
              prose-li:my-2 prose-li:leading-relaxed
              prose-strong:text-foreground
              prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/60 prose-pre:rounded-xl"
            dangerouslySetInnerHTML={{ __html: termData.content }}
          />
        </article>

        {/* Read Next / Internal Linking Block */}
        <section className="container mx-auto px-4 max-w-3xl mt-24 pt-12 border-t border-border/60">
          <h3 className="text-2xl font-bold mb-6">Keep Learning</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {glossaryTerms
              .filter((t) => t.slug !== termData.slug)
              .slice(0, 2)
              .map((term) => (
                <Link
                  key={term.slug}
                  href={`/glossary/\${term.slug}`}
                  className="p-6 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/50 transition-colors group"
                >
                  <h4 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {term.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {term.description}
                  </p>
                </Link>
              ))}
          </div>
        </section>

        {/* Action Block */}
        <section className="container mx-auto px-4 max-w-3xl mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-8 sm:p-12 text-center">
           <Zap className="w-10 h-10 text-primary mx-auto mb-6" />
           <h3 className="text-2xl md:text-3xl font-bold mb-4">Are your {termData.title.toLowerCase()}s optimized?</h3>
           <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
             Stop guessing your SEO performance. Get a free technical audit and find out exactly what&apos;s holding your website back from ranking higher.
           </p>
           <Link href="/sign-up">
              <Button size="lg" className="rounded-full h-12 px-8 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all gap-2">
                Scan Your Domain for Free <ArrowRight className="w-4 h-4" />
              </Button>
           </Link>
        </section>
      </main>
    </div>
  )
}
