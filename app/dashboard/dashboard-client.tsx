"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, TrendingUp, Globe, ArrowUpRight, Zap } from "lucide-react";

interface Report {
  id: string;
  domainUrl: string;
  score: number;
  createdAt: string;
}

interface Props {
  userName: string;
  totalScans: number;
  avgScore: number;
  recentReports: Report[];
  children: React.ReactNode; // ScanForm
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "#3ecf8e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center h-12 w-12 shrink-0">
      <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute text-xs font-bold"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

export function DashboardClient({ userName, totalScans, avgScore, recentReports, children }: Props) {
  const stats = [
    {
      label: "Total Scans",
      value: totalScans,
      icon: Globe,
      suffix: "",
      description: "domains analyzed",
    },
    {
      label: "Avg. Score",
      value: avgScore,
      icon: TrendingUp,
      suffix: "/100",
      description: "across all reports",
    },
    {
      label: "Current Plan",
      value: "Free",
      icon: Zap,
      suffix: "",
      description: "upgrade for unlimited",
      isText: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav bar */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-8 max-w-6xl h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shadow-md shadow-primary/30">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base tracking-tight">SEO Boost</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border border-primary/20 uppercase text-xs font-semibold tracking-wider px-3"
            >
              Free
            </Badge>
            <Link href="/pricing">
              <Button
                size="sm"
                className="h-8 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all"
              >
                Upgrade
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <motion.div
        className="container mx-auto px-4 sm:px-8 py-10 max-w-6xl"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={item} className="mb-8">
          <p className="text-sm text-muted-foreground mb-1">Welcome back</p>
          <h1 className="text-3xl font-bold tracking-tight">
            Hey, {userName} 👋
          </h1>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/60 bg-card p-5 flex items-center gap-4 hover:border-primary/30 transition-colors duration-200"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">{stat.label}</p>
                <p className="text-2xl font-bold leading-none">
                  {stat.value}
                  {stat.suffix && <span className="text-sm text-muted-foreground font-normal ml-0.5">{stat.suffix}</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Scan Card */}
        <motion.div variants={item} className="mb-10">
          <div className="rounded-2xl border border-primary/25 bg-card shadow-xl shadow-primary/5 overflow-hidden">
            {/* Card top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-1">New Domain Scan</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-lg">
                Enter any domain to instantly get a full SEO health report with actionable insights.
              </p>
              {children}
            </div>
          </div>
        </motion.div>

        {/* Recent Reports */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">Recent Reports</h2>
            {recentReports.length > 0 && (
              <span className="text-xs text-muted-foreground">{recentReports.length} total</span>
            )}
          </div>

          {recentReports.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-border/60 rounded-2xl bg-muted/20">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-primary/60" />
              </div>
              <h3 className="text-base font-semibold mb-2">No reports yet</h3>
              <p className="text-sm text-muted-foreground">
                Run your first scan using the input above to see results here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentReports.map((report, idx) => {
                let hostname = report.domainUrl;
                try { hostname = new URL(report.domainUrl).hostname; } catch {}
                const date = new Date(report.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                return (
                  <motion.div
                    key={report.id}
                    variants={item}
                  transition={{ delay: idx * 0.04 }}
                  >
                    <Link href={`/dashboard/report/${report.id}`}>
                      <div className="group rounded-xl border border-border/60 bg-card p-5 flex items-center gap-4 hover:border-primary/40 hover:bg-card/80 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 cursor-pointer">
                        <ScoreRing score={report.score} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate group-hover:text-primary transition-colors duration-200">
                            {hostname}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
