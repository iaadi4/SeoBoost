"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export function HeroAnimations() {
  return (
    <>
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
        className="text-6xl sm:text-8xl font-black tracking-tight mb-8 leading-[1.1] text-foreground"
      >
        Dominate <br className="hidden sm:block" />
        <span className="text-primary drop-shadow-[0_0_20px_rgba(36,180,126,0.3)]">
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
        <Link href="/sign-in">
          <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform duration-300 bg-primary text-[#1c1c1c] font-semibold hover:bg-primary/90">
            Start Free Scan <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 sm:mt-0 sm:ml-4">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-[#1c1c1c] flex items-center justify-center">
                <Image width={32} height={32} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="user" className="w-full h-full rounded-full" unoptimized />
              </div>
            ))}
          </div>
          <span>Trusted by 5,000+ founders</span>
        </div>
      </motion.div>
    </>
  );
}
