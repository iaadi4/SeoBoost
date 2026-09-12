import Image from 'next/image'
import Link from 'next/link'
import { SeoBoostWordmark } from '@/components/brand/logo'

export function AuthSplit({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="grid min-h-screen bg-background md:grid-cols-2">
      <div className="relative hidden min-h-screen md:block">
        <Image
          src="/images/hero-product.png"
          alt="Laptop on a cream desk showing a large B health grade"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
      </div>
      <div className="relative flex flex-col items-center justify-center px-4 py-16">
        <Link href="/" className="mb-10">
          <SeoBoostWordmark markSize={32} />
        </Link>
        {children}
      </div>
    </main>
  )
}
