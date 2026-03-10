"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Globe, Zap } from "lucide-react";
import Image from "next/image";

// Floating orb
function Orb({
  className,
  delay = 0,
  duration = 8,
}: {
  className: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{
        y: [-20, 20, -20],
        x: [-10, 10, -10],
        opacity: [0.4, 0.7, 0.4],
      }}
      transition={{ duration, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

// Dot grid background
function DotGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none -z-10"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(62,207,142,0.12) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        maskImage:
          "radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)",
      }}
    />
  );
}

// Mini scan result card
function ScanPreviewCard() {
  const items = [
    { label: "Title Tag", status: "pass" },
    { label: "Meta Description", status: "fail" },
    { label: "Open Graph", status: "pass" },
    { label: "Image Alt Text", status: "warning" },
    { label: "Canonical URL", status: "pass" },
  ];
  const colors: Record<string, string> = {
    pass: "#3ecf8e",
    fail: "#ef4444",
    warning: "#f59e0b",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.7, ease: "easeOut" }}
      className="mt-14 max-w-2xl mx-auto"
    >
      <div className="rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-sm shadow-2xl shadow-primary/10 overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-muted/30">
          <div className="h-3 w-3 rounded-full bg-red-500/60" />
          <div className="h-3 w-3 rounded-full bg-amber-500/60" />
          <div className="h-3 w-3 rounded-full bg-primary/60" />
          <div className="flex-1 ml-3 h-6 rounded-md bg-muted/60 flex items-center px-3">
            <Globe className="h-3 w-3 text-muted-foreground mr-2" />
            <span className="text-xs text-muted-foreground font-mono">
              example.com
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-primary font-semibold">
            <Zap className="h-3 w-3" /> 87/100
          </div>
        </div>
        {/* Scan results */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              className="flex items-center gap-3 rounded-lg bg-muted/20 border border-border/40 px-4 py-2.5"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + i * 0.1, duration: 0.4 }}
            >
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{
                  backgroundColor: colors[item.status],
                  boxShadow: `0 0 6px ${colors[item.status]}`,
                }}
              />
              <span className="text-sm text-foreground font-medium">
                {item.label}
              </span>
              <span
                className="ml-auto text-xs font-semibold capitalize"
                style={{ color: colors[item.status] }}
              >
                {item.status}
              </span>
            </motion.div>
          ))}
        </div>
        {/* Bottom bar */}
        <div className="px-5 pb-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <span className="text-muted-foreground">
              Found <span className="text-primary font-semibold">3 issues</span>{" "}
              — add meta description, compress images, fix broken link
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function HeroAnimations() {
  return (
    <>
      {/* Animated background orbs */}
      <Orb
        className="w-[500px] h-[500px] bg-primary/15 -top-32 -left-32"
        delay={0}
        duration={10}
      />
      <Orb
        className="w-[400px] h-[400px] bg-primary/10 -top-16 -right-24"
        delay={2}
        duration={12}
      />
      <Orb
        className="w-[300px] h-[300px] bg-primary/8 top-40 left-1/2"
        delay={4}
        duration={9}
      />

      <DotGrid />

      {/* Live badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium border-primary/25 bg-primary/8 text-primary mb-8 gap-2"
      >
        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
        SEO Analytics Engine 2.0 — Live
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="text-6xl sm:text-8xl font-black tracking-tight mb-8 leading-[1.05] text-foreground"
      >
        Dominate
        <br className="hidden sm:block" />
        <span className="text-primary [text-shadow:0_0_40px_rgba(62,207,142,0.25)]">
          Search Results.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed font-light"
      >
        Scan any domain in seconds. Get a beautiful, actionable SEO report that
        tells you exactly what to fix — and how.
      </motion.p>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <Link href="/sign-in">
          <Button
            size="lg"
            className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/25 hover:scale-105 hover:shadow-primary/40 transition-all duration-300 bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
          >
            Start Free Scan <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 sm:mt-0 sm:ml-4">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center"
              >
                <Image
                  width={32}
                  height={32}
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`}
                  alt="user"
                  className="w-full h-full rounded-full"
                  unoptimized
                />
              </div>
            ))}
          </div>
          <span>Trusted by 50+ founders</span>
        </div>
      </motion.div>

      {/* Animated scan preview */}
      <ScanPreviewCard />
    </>
  );
}
