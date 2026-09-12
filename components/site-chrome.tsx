'use client'

import Link from 'next/link'
import { SeoBoostWordmark } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/sign-out-button'
import { SCANNER_CHECK_COUNT } from '@/lib/claims'
import { cn } from '@/lib/utils'

const marketingLinks = [
  { href: '/#features', label: 'Product' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/glossary', label: 'Glossary' },
]

export function SiteHeader({
  signedIn = false,
  variant = 'marketing',
}: {
  signedIn?: boolean
  variant?: 'marketing' | 'app'
}) {
  return (
    <header className="sticky top-0 z-50 w-full pt-3">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between rounded-full border border-border bg-card/80 px-3 sm:px-4 backdrop-blur-md">
          <Link href="/" aria-label="SeoBoost home">
            <SeoBoostWordmark markSize={28} />
          </Link>

          {variant === 'marketing' ? (
            <nav
              className="hidden items-center gap-1 md:flex"
              aria-label="Main navigation"
            >
              {marketingLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : (
            <nav className="hidden items-center gap-1 sm:flex" aria-label="App">
              <Link
                href="/dashboard"
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Scan
              </Link>
              <Link
                href="/dashboard/reports"
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Reports
              </Link>
              <Link
                href="/dashboard/account"
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Account
              </Link>
            </nav>
          )}

          <div className="flex items-center gap-2">
            {signedIn ? (
              <>
                {variant === 'app' && (
                  <Link
                    href="/dashboard/account"
                    className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:hidden"
                  >
                    Account
                  </Link>
                )}
                <SignOutButton />
                {variant === 'marketing' && (
                  <Link href="/dashboard">
                    <Button size="sm" className="rounded-full px-4">
                      Dashboard
                    </Button>
                  </Link>
                )}
              </>
            ) : variant === 'marketing' ? (
              <>
                <Link href="/seo-audit-login" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="rounded-full px-3">
                    Sign in
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm" className="rounded-full px-4">
                    Get started
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/pricing">
                <Button size="sm" className="rounded-full px-4">
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('border-t border-border bg-background', className)}>
      <div className="container mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <SeoBoostWordmark markSize={28} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              HTML technical SEO audits: up to 50 pages on Hobby or 500 on Pro,{' '}
              {SCANNER_CHECK_COUNT} checks, an A–F score, and a fix list. Not
              Core Web Vitals. Not a GEO score.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              { href: '/#features', label: 'Audit checks' },
              { href: '/pricing', label: 'Pricing' },
            ]}
          />
          <FooterCol
            title="Learn"
            links={[
              { href: '/glossary', label: 'SEO glossary' },
              { href: '/glossary/canonical-tag', label: 'Canonical tags' },
              { href: 'mailto:hello@seoboost.app', label: 'Support' },
            ]}
          />
          <FooterCol
            title="Account"
            links={[
              { href: '/seo-audit-login', label: 'Sign in' },
              { href: '/sign-up', label: 'Create account' },
            ]}
          />
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SeoBoost. Technical SEO audits.
          </p>
          <p className="text-xs text-muted-foreground">
            Crawl · snippet · index — not Core Web Vitals or GEO scores.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
