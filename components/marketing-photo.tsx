import Image from 'next/image'
import { cn } from '@/lib/utils'

export function MarketingPhoto({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  sizes = '(min-width: 1024px) 56rem, 100vw',
}: {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
  className?: string
  sizes?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-3xl border border-border bg-muted',
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes={sizes}
        className="h-full w-full object-cover"
      />
    </div>
  )
}
