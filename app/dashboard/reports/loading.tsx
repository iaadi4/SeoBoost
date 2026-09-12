import { SiteHeader } from '@/components/site-chrome'

export default function ReportsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader signedIn variant="app" />
      <div className="container mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Reports
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">
          Loading reports…
        </h1>
        <div className="mt-8 h-48 rounded-3xl border border-dashed border-border bg-card" />
      </div>
    </div>
  )
}
