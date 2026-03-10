import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Zap,
  LayoutDashboard,
  CheckCircle2,
  X,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";
import { HeroAnimations } from "./hero-animations";
import { BentoGrid } from "./bento-grid";

const features = [
  { name: "Scans per domain", free: "3 total", pro: "Unlimited" },
  { name: "SEO Health Score", free: true, pro: true },
  { name: "Title & Meta checks", free: true, pro: true },
  { name: "Image optimization", free: false, pro: true },
  { name: "Internal link analysis", free: false, pro: true },
  { name: "Broken link detection", free: false, pro: true },
  { name: "Export reports to PDF", free: false, pro: true },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (value === true)
    return <CheckCircle2 className="h-4 w-4 text-primary mx-auto" />;
  if (value === false)
    return <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
  return <span className="text-sm font-medium text-foreground">{value}</span>;
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans overflow-hidden">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-8 h-16 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">SEO Boost</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="#features"
              className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            {user ? (
              <>
                <SignOutButton />
                <Link href="/dashboard">
                  <Button className="rounded-full shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
                    Dashboard <LayoutDashboard className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link href="/sign-up">
                  <Button className="rounded-full shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative container mx-auto px-4 sm:px-8 pt-32 pb-24 text-center max-w-7xl overflow-visible">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-primary/8 blur-[140px] rounded-full pointer-events-none -z-10" />
          <HeroAnimations />
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-24 relative z-10">
          <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
            <div className="text-center mb-16">
              <span className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full mb-4">
                Features
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
                Everything you need to rank higher
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Stop guessing what Google wants. Our algorithm tells you exactly
                what to fix in seconds.
              </p>
            </div>
            <BentoGrid />
          </div>
        </section>

        {/* ── Stats strip ── */}
        <section className="border-y border-border/60 bg-muted/20 py-16">
          <div className="container mx-auto px-4 sm:px-8 max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "50+", label: "Founders using SEO Boost" },
                { value: "8s", label: "Average scan time" },
                { value: "12+", label: "SEO checks per report" },
                { value: "$9", label: "One-time unlock price" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-4xl font-black text-primary mb-1">
                    {s.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="py-24">
          <div className="container mx-auto px-4 sm:px-8 max-w-5xl">
            <div className="text-center mb-14">
              <span className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full mb-4">
                Pricing
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
                Pay once. <span className="text-primary">Scan forever.</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                No subscriptions, no renewals. One payment unlocks unlimited
                scans for life.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
              {/* Free */}
              <div className="rounded-2xl border border-border/60 bg-card p-8 flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Hobby
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-extrabold">$0</span>
                  <span className="text-muted-foreground mb-1">forever</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Try it with 3 free scans
                </p>
                <ul className="space-y-2.5 flex-1 mb-8 text-sm">
                  {[
                    "3 scans total",
                    "Full SEO Health Score",
                    "Meta & title checks",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up" className="w-full">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-xl border-border/80 hover:border-primary/40 hover:text-primary transition-all"
                  >
                    Get Started Free
                  </Button>
                </Link>
              </div>

              {/* Pro */}
              <div
                className="relative rounded-2xl bg-card flex flex-col overflow-hidden"
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(62,207,142,0.4), 0 8px 48px -8px rgba(62,207,142,0.2)",
                }}
              >
                <div className="absolute inset-0 rounded-2xl border border-primary/50 pointer-events-none" />
                <div className="absolute -top-px left-0 right-0 flex justify-center">
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-b-lg">
                    Best Value
                  </span>
                </div>
                <div className="p-8 pt-10 flex flex-col flex-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                    Pro
                  </p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-5xl font-extrabold text-primary">
                      $9
                    </span>
                    <span className="text-muted-foreground mb-1">one‑time</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Pay once, scan unlimited domains
                  </p>
                  <ul className="space-y-2.5 flex-1 mb-8 text-sm">
                    {[
                      "Unlimited scans — forever",
                      "Advanced link analysis",
                      "Image optimization insights",
                      "PDF report export",
                      "Priority support",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/pricing" className="w-full">
                    <Button
                      size="lg"
                      className="w-full rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-lg shadow-primary/25 gap-2"
                    >
                      Unlock for $9 <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Comparison table */}
            <div className="rounded-2xl border border-border/60 overflow-hidden max-w-3xl mx-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="text-left px-6 py-3.5 font-semibold text-muted-foreground">
                      Feature
                    </th>
                    <th className="text-center px-6 py-3.5 font-semibold w-28">
                      Hobby
                    </th>
                    <th className="text-center px-6 py-3.5 font-semibold text-primary w-28">
                      Pro
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((f, i) => (
                    <tr
                      key={f.name}
                      className={`border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                    >
                      <td className="px-6 py-3 text-muted-foreground">
                        {f.name}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <FeatureValue value={f.free} />
                      </td>
                      <td className="px-6 py-3 text-center">
                        <FeatureValue value={f.pro} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-28 relative overflow-hidden border-t border-border/60">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(62,207,142,0.07) 0%, transparent 70%)",
            }}
          />
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <span className="inline-flex items-center text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full mb-6">
              Start today
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-5 tracking-tight">
              Your site&apos;s SEO score
              <br />
              <span className="text-primary">in under 10 seconds.</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
              No setup. No credit card. Paste a domain and get a full technical
              audit instantly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="h-13 px-10 text-base rounded-full shadow-xl shadow-primary/25 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:scale-105 transition-all duration-300"
                >
                  Start Free Scan <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link
                href="#pricing"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                or unlock unlimited for $9 →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/60 bg-background">
        <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
          <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                  <Zap className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-base tracking-tight">
                  SEO Boost
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Instant SEO audits for founders, marketers, and developers who
                want to rank.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Product
              </p>
              <ul className="space-y-2.5">
                {[
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "All Reports", href: "/dashboard/reports" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Account
              </p>
              <ul className="space-y-2.5">
                {[
                  { label: "Sign In", href: "/sign-in" },
                  { label: "Sign Up", href: "/sign-up" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Legal
              </p>
              <ul className="space-y-2.5">
                {[
                  { label: "Privacy Policy", href: "#" },
                  { label: "Terms of Service", href: "#" },
                ].map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-border/60 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} SEO Boost Analytics. All rights
              reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Made with <span className="text-primary">♥</span> for founders who
              want to rank.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
