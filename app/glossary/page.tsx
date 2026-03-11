import Link from 'next/link'
import { Zap, BookOpen, ArrowRight } from 'lucide-react'
import { glossaryTerms } from '@/lib/glossary-data'
import { Button } from '@/components/ui/button'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SEO Glossary | Learn SEO Terms | SEO Boost',
  description: 'Comprehensive SEO glossary explaining essential search engine optimization terms, technical concepts, and best practices. Master SEO with SEO Boost.',
  alternates: {
    canonical: '/glossary',
  },
}

export default function GlossaryIndex() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
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
             <Link href="/pricing">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Pricing
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Dashboard
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 max-w-4xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
              The Ultimate <span className="text-primary">SEO Glossary</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Master the terminology of Search Engine Optimization. From technical on-page ranking factors to advanced off-page strategies, understand exactly what it takes to rank.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {glossaryTerms.map((term) => (
              <Link 
                key={term.slug} 
                href={`/glossary/\${term.slug}`}
                className="group p-6 rounded-2xl border border-border/60 bg-card hover:bg-muted/30 transition-all hover:border-primary/50 flex flex-col h-full shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {term.title}
                  </h2>
                  <span className="text-xs font-semibold px-2 py-1 bg-muted rounded-md text-muted-foreground uppercase tracking-wider">
                    {term.category}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-6">
                  {term.description}
                </p>
                <div className="flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                  Read Guide <ArrowRight className="ml-1 w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/60 bg-muted/20 py-20">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <h2 className="text-3xl font-bold mb-4">Stop guessing. Start ranking.</h2>
            <p className="text-muted-foreground mb-8">
              Knowing the terminology is step one. Applying it is step two. Run a technical SEO audit on your website right now.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="h-12 px-8 rounded-full">
                Scan Your Domain for Free
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
