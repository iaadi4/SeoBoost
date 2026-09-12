'use client'

import { cn } from '@/lib/utils'

export function PaperGlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[920px] -translate-x-1/2 -z-10 blur-3xl paper-glow',
        className
      )}
    />
  )
}

function Float({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none seo-float', className)}>
      {children}
    </div>
  )
}

export function SerpCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'mx-auto mt-16 w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card text-left',
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <span className="h-2 w-2 rounded-full bg-index" />
        <span className="font-mono text-xs text-muted-foreground">
          search · example.com
        </span>
        <span className="ml-auto text-xs text-muted-foreground">SERP</span>
      </div>
      <div className="space-y-4 p-6">
        {[
          {
            title: 'Technical SEO audit for example.com',
            url: 'https://example.com/seo-audit',
            snippet: 'Title, canonical, robots, and snippet fields — one crawl.',
            indexed: true,
          },
          {
            title: 'Why missing meta descriptions lose clicks',
            url: 'https://example.com/meta-description',
            snippet: 'A 150–160 character summary Google can quote in results.',
            indexed: false,
          },
          {
            title: 'Canonical tags, explained',
            url: 'https://example.com/canonical',
            snippet: 'Point duplicates at one preferred URL before they split.',
            indexed: true,
          },
        ].map((row) => (
          <div key={row.url} className="space-y-1">
            <p className="font-display text-xl leading-snug text-foreground">
              {row.title}
            </p>
            <p className="text-xs text-index">{row.url}</p>
            <p className="text-sm text-muted-foreground">{row.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CrawlGraph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 160"
      className={cn('h-full w-full', className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M40 80 C80 20, 140 20, 160 80 C180 140, 240 140, 280 80"
        stroke="currentColor"
        className="text-border"
        strokeWidth="1.25"
      />
      <path
        d="M50 120 L120 40 L200 110 L270 50"
        stroke="currentColor"
        className="text-foreground/20"
        strokeWidth="1"
      />
      {[
        [40, 80],
        [120, 40],
        [160, 80],
        [200, 110],
        [270, 50],
        [280, 80],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i % 2 === 0 ? 4 : 3}
          className={i % 3 === 0 ? 'fill-index' : 'fill-foreground/50'}
        />
      ))}
    </svg>
  )
}

export function SitemapTree({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 140"
      className={cn('h-full w-full', className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M140 16 V48 M140 48 H60 V80 M140 48 H220 V80 M60 80 H28 V112 M60 80 H92 V112 M220 80 H188 V112 M220 80 H252 V112"
        stroke="currentColor"
        className="text-border"
        strokeWidth="1.25"
      />
      {[
        [132, 8, 16, 16],
        [52, 72, 16, 16],
        [212, 72, 16, 16],
        [20, 104, 16, 16],
        [84, 104, 16, 16],
        [180, 104, 16, 16],
        [244, 104, 16, 16],
      ].map(([x, y, w, h], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={w}
          height={h}
          rx="3"
          className={i === 0 ? 'fill-foreground' : 'fill-card stroke-border'}
          strokeWidth="1"
        />
      ))}
    </svg>
  )
}

export function SnippetStack({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {['w-[92%]', 'w-full', 'w-[70%]'].map((w, i) => (
        <div
          key={i}
          className={cn('h-2.5 rounded-full bg-foreground/10', w, i === 0 && 'bg-foreground/70')}
        />
      ))}
    </div>
  )
}

export function IndexDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5', className)} aria-hidden="true">
      <span className="h-2 w-2 rounded-full bg-index" />
      <span className="h-2 w-2 rounded-full bg-index/50" />
      <span className="h-2 w-2 rounded-full bg-border" />
    </div>
  )
}

export function FloatingArt({ className }: { className?: string }) {
  return (
    <Float className={cn('absolute right-0 top-24 hidden lg:block', className)}>
      <div className="w-48 rounded-3xl border border-border bg-card/80 p-4">
        <SnippetStack />
        <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>Indexed</span>
          <IndexDots />
        </div>
      </div>
    </Float>
  )
}
