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
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { AuthSplit } from '@/components/auth-split'
import { mapAuthError } from '@/lib/auth-ui'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('reset') === '1') {
      setNotice('Password updated. Sign in with your new password.')
    } else if (params.get('error')) {
      setError(
        mapAuthError(params.get('error_description'), 'confirm')
      )
    }
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setError(mapAuthError(signInError.message, 'signin'))
      setIsLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <AuthSplit>
      <Card className="w-full max-w-md py-8">
        <CardHeader className="space-y-2 px-6 text-left">
          <CardTitle className="text-3xl font-normal">
            <h1 className="font-display text-3xl tracking-tight">
              Sign in to SeoBoost
            </h1>
          </CardTitle>
          <CardDescription className="text-base">
            Open your reports and run another HTML scan (50 pages Hobby, 500
            Pro).
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
                aria-describedby={error ? 'signin-error' : undefined}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">
                  Password <RequiredMark />
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-foreground underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'signin-error' : undefined}
              />
            </div>

            {notice && (
              <p role="status" className="text-sm text-accent">
                {notice}
              </p>
            )}

            {error && (
              <p id="signin-error" role="alert" className="field-error">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/sign-up"
              className="text-foreground underline underline-offset-4"
            >
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
