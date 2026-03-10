import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Star, Shield, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/utils/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";
import { HeroAnimations } from "./hero-animations";
import { BentoGrid } from "./bento-grid";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/30 font-sans overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-8 h-16 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">SEO Boost</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="#features" className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <ThemeToggle />
            {user ? (
              <>
                <SignOutButton />
                <Link href="/dashboard">
                  <Button className="rounded-full shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all bg-primary text-[#1c1c1c] font-semibold hover:bg-primary/90">
                    Dashboard <LayoutDashboard className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/sign-in" className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Sign In
                </Link>
                <Link href="/sign-up">
                  <Button className="rounded-full rounded-br-none shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all bg-primary text-[#1c1c1c] font-semibold hover:bg-primary/90">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Animated Hero Section */}
        <section className="relative container mx-auto px-4 sm:px-8 pt-32 pb-24 text-center max-w-7xl">
          {/* Background Gradients */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
          
          <HeroAnimations />
        </section>

        {/* Feature Bento Grid */}
        <section id="features" className="py-24 relative z-10">
          <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">Everything you need to rank higher</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Stop guessing what Google wants. Our algorithm tells you exactly what to fix in seconds.</p>
            </div>
            
            <BentoGrid />
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-24 bg-muted/30 border-y">
            <div className="container mx-auto px-4 sm:px-8 max-w-5xl text-center">
                <Shield className="h-12 w-12 text-primary/50 mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-10">Loved by marketing teams worldwide</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { 
                            quote: "SEO Boost replaced 3 different tools we were using. The reports are so easy to read that even our non-technical writers understand them.", 
                            name: "Sarah J.", 
                            role: "Head of Content" 
                        },
                        { 
                            quote: "We increased our organic traffic by 40% in two months just by following the actionable fixes in the dashboard.", 
                            name: "Mark T.", 
                            role: "Startup Founder" 
                        },
                        { 
                            quote: "The technical checks are lightning fast. It immediately caught a noindex tag we accidentally pushed to production. Saved us instantly.", 
                            name: "Elena R.", 
                            role: "Marketing Director" 
                        }
                    ].map((testimonial, i) => (
                        <div key={i} className="text-left bg-background p-6 rounded-2xl border shadow-sm">
                            <div className="flex gap-1 text-yellow-500 mb-4">
                                {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-current" />)}
                            </div>
                            <p className="text-muted-foreground mb-6 line-clamp-4">&quot;{testimonial.quote}&quot;</p>
                            <div>
                                <div className="font-semibold">{testimonial.name}</div>
                                <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
        
        {/* CTA */}
        <section className="py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 -z-10" />
            <div className="container mx-auto px-4 text-center max-w-3xl">
                <h2 className="text-4xl sm:text-5xl font-bold mb-6">Ready to rank #1?</h2>
                <p className="text-xl text-muted-foreground mb-10">Join thousands of companies using SEO Boost to optimize their organic presence.</p>
                <Link href="/dashboard">
                    <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-lg">
                        Get Started for Free
                    </Button>
                </Link>
            </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-6 max-w-7xl">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">SEO Boost</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SEO Boost Analytics. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
