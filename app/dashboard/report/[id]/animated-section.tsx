import { ReactNode } from 'react'

export function AnimatedSection({ children }: { children: ReactNode }) {
  return <div className="grid gap-5">{children}</div>
}

export function AnimatedItem({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}
