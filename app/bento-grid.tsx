"use client";

import { motion } from "framer-motion";
import { BarChart, CheckCircle2, Globe, TrendingUp } from "lucide-react";

export function BentoGrid() {
  return (
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
  );
}
