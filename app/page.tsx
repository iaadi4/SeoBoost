"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart, CheckCircle2, Zap, Star, Shield, TrendingUp, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "framer-motion";

export default function Home() {
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
            <Link href="/dashboard">
              <Button className="rounded-full rounded-br-none shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Animated Hero Section */}
        <section className="relative container mx-auto px-4 sm:px-8 pt-32 pb-24 text-center max-w-7xl">
          {/* Background Gradients */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors border-primary/20 bg-primary/5 text-primary mb-8 gap-2"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]"></span>
            SEO Analytics Engine 2.0 Live
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl sm:text-8xl font-black tracking-tight mb-8 leading-[1.1]"
          >
            Dominate <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-teal-400">
              Search Results.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed font-light"
          >
            Scan your domain instantly. Get a beautiful, readable report with actionable fixes to boost your organic traffic today.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/dashboard">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform duration-300">
                Start Free Scan <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 sm:mt-0 sm:ml-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <Image width={32} height={32} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="user" className="w-full h-full rounded-full" unoptimized />
                  </div>
                ))}
              </div>
              <span>Trusted by 5,000+ founders</span>
            </div>
          </motion.div>
        </section>

        {/* Feature Bento Grid */}
        <section id="features" className="py-24 relative z-10">
          <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">Everything you need to rank higher</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Stop guessing what Google wants. Our algorithm tells you exactly what to fix in seconds.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-card to-background border flex flex-col justify-between shadow-sm relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full blur-3xl -z-10 group-hover:bg-primary/10 transition-colors" />
                <div>
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Globe className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Deep Technical Scan</h3>
                  <p className="text-muted-foreground text-lg max-w-md">We crawl your page, analyzing title tags, viewport configurations, robots meta, open graph data, and missing alt texts instantly.</p>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-gradient-to-br from-card to-background border flex flex-col shadow-sm group"
              >
                <div className="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6">
                  <BarChart className="h-7 w-7 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Health Score</h3>
                <p className="text-muted-foreground text-lg">Instantly see where you stand with our proprietary SEO Health Score out of 100.</p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-gradient-to-br from-card to-background border flex flex-col shadow-sm group"
              >
                <div className="h-14 w-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-7 w-7 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Actionable Fixes</h3>
                <p className="text-muted-foreground text-lg">We don&apos;t just point out problems. We tell you exactly how to fix them in plain English.</p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-card to-background border flex flex-col justify-between shadow-sm relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-bl-full blur-3xl -z-10 group-hover:bg-blue-500/10 transition-colors" />
                <div>
                  <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                    <TrendingUp className="h-7 w-7 text-blue-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Content Analysis</h3>
                  <p className="text-muted-foreground text-lg max-w-md">We verify your content volume and keyword structures to ensure pages aren&apos;t penalized for thin content.</p>
                </div>
              </motion.div>
            </div>
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
