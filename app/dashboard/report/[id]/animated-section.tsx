'use client'

import { motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

export function AnimatedSection({ children }: { children: ReactNode }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid gap-5">
      {children}
    </motion.div>
  )
}

export function AnimatedItem({ children }: { children: ReactNode }) {
  return <motion.div variants={item}>{children}</motion.div>
}
