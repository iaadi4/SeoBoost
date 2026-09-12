import { SiteHeader } from '@/components/site-chrome'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader signedIn variant="app" />
      <div className="container mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Dashboard
        </p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">
          Loading reports…
        </h1>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="h-24 rounded-3xl border border-border bg-card" />
          <div className="h-24 rounded-3xl border border-border bg-card" />
          <div className="h-24 rounded-3xl border border-border bg-card" />
        </div>
        <div className="mt-8 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Fetching your scans and plan limits.
          </p>
        </div>
      </div>
    </div>
  )
}
