import { cn } from '@/lib/utils'

export function SeoBoostMark({
  className,
  size = 32,
}: {
  className?: string
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <rect
        x="1.25"
        y="1.25"
        width="29.5"
        height="29.5"
        rx="9"
        className="fill-card stroke-border"
        strokeWidth="1.25"
      />
      <rect x="7" y="8.5" width="14" height="2.4" rx="1.2" className="fill-foreground" />
      <rect x="7" y="14.8" width="18" height="2.4" rx="1.2" className="fill-foreground/35" />
      <rect x="7" y="21.1" width="11" height="2.4" rx="1.2" className="fill-index" />
    </svg>
  )
}

export function SeoBoostWordmark({
  className,
  markSize = 32,
}: {
  className?: string
  markSize?: number
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <SeoBoostMark size={markSize} />
      <span className="text-[17px] font-medium tracking-tight text-foreground">
        SeoBoost
      </span>
    </span>
  )
}
