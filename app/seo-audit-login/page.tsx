'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://boost-seo.vercel.app',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'SEO Audit Login',
        item: 'https://boost-seo.vercel.app/seo-audit-login',
      },
    ],
  }

  return (
    <main id="main-content" className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30 relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full pointer-events-none -z-10" />

      <header>
        <Link href="/" className="flex items-center gap-2 mb-8 group">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-2xl tracking-tight">SEO Boost</span>
        </Link>
      </header>

      <Card className="w-full max-w-md border shadow-xl bg-background/50 backdrop-blur-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">
            <h1 className="text-2xl font-bold inline">Sign in to SEO Boost</h1>
          </CardTitle>
          <CardDescription>
            Sign in to your account to continue scanning domains.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full font-medium h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="animate-pulse">Signing in...</span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/sign-up"
              className="text-primary hover:underline font-medium"
            >
              Sign up for free
            </Link>
          </div>
        </CardContent>
      </Card>

      <footer className="mt-12 max-w-lg text-center text-sm text-muted-foreground space-y-4">
        <p>
          Securely sign in to your SEO Boost account to access your technical SEO audit reports. 
          Our comprehensive scanning engine analyzes your domains to identify missing H1 tags, thin content, 
          render-blocking resources, canonical link mismatches, and structural schema opportunities. 
          By identifying these core issues, you can dramatically improve your website's health score 
          and increase your organic search engine rankings.
        </p>
        <p>
          Gain direct visibility into your Core Web Vitals, accessibility warnings, and mobile performance benchmarks. 
          Save your progress, export PDF reports for clients, and track improvements over time—all from an intuitive, single dashboard.
        </p>
        <p>© {new Date().getFullYear()} SEO Boost Analytics. All rights reserved.</p>
      </footer>
    </main>
  )
}
