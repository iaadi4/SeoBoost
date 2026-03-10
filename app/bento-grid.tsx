'use client'

import { motion, useInView } from 'framer-motion'
import type { Variants } from 'framer-motion'
import {
  Globe,
  BarChart3,
  CheckCircle2,
  TrendingUp,
  Zap,
  Shield,
} from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

const card: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

// Animated counter
function Counter({ to, duration = 1500 }: { to: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = Math.ceil(to / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= to) {
        setCount(to)
        clearInterval(timer)
      } else setCount(start)
    }, 16)
    return () => clearInterval(timer)
  }, [inView, to, duration])

  return <span ref={ref}>{count}</span>
}

// Animated scan lines
function ScanLines() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          initial={{ top: '0%', opacity: 0 }}
          animate={{ top: ['0%', '100%', '0%'], opacity: [0, 1, 0] }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.6,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  )
}

// Pulsing nodes network
function NodeNetwork() {
  const nodes = [
    { x: 20, y: 30 },
    { x: 50, y: 15 },
    { x: 80, y: 40 },
    { x: 35, y: 65 },
    { x: 65, y: 70 },
    { x: 85, y: 80 },
  ]
  const edges = [
    [0, 1],
    [1, 2],
    [0, 3],
    [1, 4],
    [2, 5],
    [3, 4],
    [4, 5],
  ]
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl opacity-40">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {edges.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="#3ecf8e"
            strokeWidth="0.5"
            initial={{ opacity: 0.2 }}
            animate={{ opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
        {nodes.map((n, i) => (
          <motion.circle
            key={i}
            cx={n.x}
            cy={n.y}
            r="2"
            fill="#3ecf8e"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.6, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.25 }}
          />
        ))}
      </svg>
    </div>
  )
}

// Typing effect
function TypedDomain() {
  const domains = ['example.com', 'myshop.io', 'startup.app', 'blog.co']
  const [idx, setIdx] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const full = domains[idx]
    if (!deleting && text === full) {
      const t = setTimeout(() => setDeleting(true), 1400)
      return () => clearTimeout(t)
    }
    if (deleting && text === '') {
      setDeleting(false)
      setIdx((i) => (i + 1) % domains.length)
      return
    }
    const t = setTimeout(
      () => {
        setText(deleting ? text.slice(0, -1) : full.slice(0, text.length + 1))
      },
      deleting ? 40 : 80
    )
    return () => clearTimeout(t)
  }, [text, deleting, idx, domains])

  return (
    <span className="text-primary font-mono">
      {text}
      <span className="animate-pulse">|</span>
    </span>
  )
}

export function BentoGrid() {
  const containerRef = useRef(null)
  const inView = useInView(containerRef, { once: true, margin: '-80px' })

  const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  }

  return (
    <motion.div
      ref={containerRef}
      className="grid md:grid-cols-3 gap-5"
      variants={containerVariants}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
    >
      {/* Card 1: Deep Technical Scan — col-span-2, animated scan lines */}
      <motion.div
        variants={card}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="md:col-span-2 p-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card flex flex-col gap-6 shadow-sm relative overflow-hidden group"
      >
        <ScanLines />
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/8 rounded-bl-full blur-3xl -z-10 group-hover:bg-primary/12 transition-colors duration-500" />
        <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/20">
          <Globe className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-2">Deep Technical Scan</h3>
          <p className="text-muted-foreground text-base max-w-md leading-relaxed">
            Analyzing <TypedDomain /> — title tags, viewport, robots meta, open
            graph, alt texts, and more.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap mt-auto">
          {['Meta Tags', 'OG Data', 'Alt Texts', 'Robots', 'Viewport'].map(
            (t) => (
              <span
                key={t}
                className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 font-medium"
              >
                {t}
              </span>
            )
          )}
        </div>
      </motion.div>

      {/* Card 2: Health Score — animated counter */}
      <motion.div
        variants={card}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="p-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card flex flex-col shadow-sm relative overflow-hidden group"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent rounded-2xl" />
        </div>
        <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/20 mb-5">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Health Score</h3>
        <p className="text-muted-foreground text-base mb-6">
          Proprietary SEO score out of 100 — know exactly where you stand.
        </p>
        <div className="mt-auto flex items-end gap-2">
          <span className="text-6xl font-black text-primary tabular-nums">
            <Counter to={87} duration={1800} />
          </span>
          <span className="text-xl text-muted-foreground mb-2">/100</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-primary/10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '87%' }}
            transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Card 3: Actionable Fixes */}
      <motion.div
        variants={card}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="p-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card flex flex-col shadow-sm group relative overflow-hidden"
      >
        <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/20 mb-5">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Actionable Fixes</h3>
        <p className="text-muted-foreground text-base mb-6">
          Plain-English fixes, not just a list of problems.
        </p>
        <div className="mt-auto space-y-2">
          {[
            { text: 'Add missing meta description', done: true },
            { text: 'Compress hero image (2.4MB)', done: false },
            { text: 'Fix 3 broken links found', done: false },
          ].map((fix, i) => (
            <motion.div
              key={fix.text}
              className="flex items-center gap-2.5 text-sm"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.15, duration: 0.4 }}
            >
              <CheckCircle2
                className={`h-4 w-4 shrink-0 ${fix.done ? 'text-primary' : 'text-muted-foreground/40'}`}
              />
              <span
                className={
                  fix.done
                    ? 'line-through text-muted-foreground/60'
                    : 'text-foreground'
                }
              >
                {fix.text}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Card 4: Content Analysis — col-span-2, node network */}
      <motion.div
        variants={card}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="md:col-span-2 p-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card flex flex-col justify-between shadow-sm relative overflow-hidden group"
      >
        <NodeNetwork />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/6 rounded-tr-full blur-3xl -z-10 group-hover:bg-primary/10 transition-colors duration-500" />
        <div>
          <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/20 mb-5">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Content Analysis</h3>
          <p className="text-muted-foreground text-base max-w-md leading-relaxed">
            Verify content volume, keyword structure, and internal linking to
            prevent thin-content penalties.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { label: 'Word Count', value: '1,842', icon: Shield },
            { label: 'Internal Links', value: '17', icon: Zap },
            { label: 'Keyword Density', value: '2.3%', icon: TrendingUp },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-primary/8 border border-primary/15 p-3 text-center"
            >
              <p className="text-lg font-bold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
