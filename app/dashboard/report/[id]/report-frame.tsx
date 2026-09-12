import Link from 'next/link'
import type { ReactNode } from 'react'
import { SiteHeader } from '@/components/site-chrome'
import { PaperGlow } from '@/components/seo-art'

export function ReportFrame({
  children,
  actions,
}: {
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="print:hidden">
        <SiteHeader signedIn variant="app" />
      </div>
      <div className="container relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-8 print:max-w-none print:px-4 print:py-4">
        <PaperGlow className="opacity-50 print:hidden" />
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href="/dashboard"
            className="inline-flex text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to dashboard
          </Link>
          {actions}
        </div>
        {children}
      </div>
    </div>
  )
}
