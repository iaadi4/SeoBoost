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
import { Label, RequiredMark } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { AuthSplit } from '@/components/auth-split'

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

  return (
    <AuthSplit>
      <Card className="w-full max-w-md py-8">
        <CardHeader className="space-y-2 px-6 text-left">
          <CardTitle className="text-3xl font-normal">
            <h1 className="font-display text-3xl tracking-tight">Sign in to SeoBoost</h1>
          </CardTitle>
          <CardDescription className="text-base">
            Open your reports and run another HTML scan (50 pages Hobby, 500 Pro).
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <RequiredMark />
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                aria-invalid={error ? true : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <RequiredMark />
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                aria-invalid={error ? true : undefined}
              />
            </div>

            {error && (
              <p role="alert" className="field-error">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full font-medium" disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="text-foreground underline underline-offset-4">
              Sign up for free
            </Link>
          </div>
        </CardContent>
      </Card>

      <footer className="mt-12 max-w-md space-y-4 text-center text-sm text-muted-foreground">
        <p>
          Reports cover on-page HTML: titles, canonicals, robots, headings, and
          the Pro check groups on your plan. Field Core Web Vitals are not
          measured.
        </p>
        <p>© {new Date().getFullYear()} SeoBoost. All rights reserved.</p>
      </footer>
    </AuthSplit>
  )
}
