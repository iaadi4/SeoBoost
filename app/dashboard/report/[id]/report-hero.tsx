'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, animate } from 'framer-motion'

interface ReportHeroProps {
  score: number
  domain: string
  scannedAt: string
  domainUrl: string
}

function Orb({ className, delay = 0, duration = 10 }: { className: string; delay?: number; duration?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{ y: [-20, 20, -20], x: [-10, 10, -10], opacity: [0.3, 0.55, 0.3] }}
      transition={{ duration, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  )
}

function ScoreRing({ score }: { score: number }) {
  const r = 70
  const circumference = 2 * Math.PI * r
  const [displayScore, setDisplayScore] = useState(0)
  const [dashOffset, setDashOffset] = useState(circumference)

  const scoreColor =
    score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444'

  useEffect(() => {
    const controls = animate(0, score, {
      duration: 1.6,
      ease: 'easeOut',
      onUpdate: (v) => {
        setDisplayScore(Math.round(v))
        setDashOffset(circumference - (v / 100) * circumference)
      },
    })
    return controls.stop
  }, [score, circumference])

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
        {/* Track */}
        <circle cx="90" cy="90" r={r} fill="none" stroke="currentColor" strokeWidth="12" className="text-muted/30" />
        {/* Progress */}
        <motion.circle
          cx="90" cy="90" r={r}
          fill="none"
          stroke={scoreColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ filter: `drop-shadow(0 0 8px ${scoreColor}88)` }}
        />
      </svg>
      {/* Score number */}
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-black tabular-nums" style={{ color: scoreColor }}>
          {displayScore}
        </span>
        <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">/ 100</span>
      </div>
    </div>
  )
}

export function ReportHero({ score, domain, scannedAt, domainUrl }: ReportHeroProps) {
  const scoreLabel =
    score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs Work' : 'Critical'

  const scoreLabelColor =
    score >= 80
      ? 'text-green-500 bg-green-500/10 border-green-500/20'
      : score >= 60
        ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
        : score >= 40
          ? 'text-orange-500 bg-orange-500/10 border-orange-500/20'
          : 'text-red-500 bg-red-500/10 border-red-500/20'

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-card mb-8 print:hidden">
      {/* Animated orbs */}
      <Orb className="w-72 h-72 bg-primary/10 -top-16 -left-16" delay={0} duration={12} />
      <Orb className="w-56 h-56 bg-primary/8 top-8 -right-20" delay={3} duration={9} />
      <Orb className="w-40 h-40 bg-blue-500/8 bottom-0 left-1/2" delay={1.5} duration={14} />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 p-8">
        {/* Score ring */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'backOut' }}
          className="shrink-0"
        >
          <ScoreRing score={score} />
        </motion.div>

        {/* Domain info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 text-center md:text-left"
        >
          <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
            <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${scoreLabelColor}`}>
              {scoreLabel}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-1">
            <span className="text-muted-foreground font-normal text-xl block mb-0.5">SEO Audit</span>
            {domain}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Scanned {new Date(scannedAt).toLocaleString()}
          </p>
          <a
            href={domainUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
          >
            Visit Live Site ↗
          </a>
        </motion.div>

        {/* Metric chips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="shrink-0 flex flex-col gap-3"
        >
          <div className="text-xs text-muted-foreground uppercase tracking-widest text-center mb-1">SEO Health</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Score', val: `${score}`, color: score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500' },
              { label: 'Grade', val: score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F', color: score >= 70 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500' },
            ].map((chip) => (
              <div key={chip.label} className="bg-muted/60 border border-border/60 rounded-xl px-4 py-3 text-center">
                <div className={`text-2xl font-black ${chip.color}`}>{chip.val}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{chip.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
