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
import { AuthSplit } from '@/components/auth-split'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      setSuccess(true)
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <AuthSplit>
        <Card className="w-full max-w-md py-8 text-center">
          <CardHeader className="space-y-2 px-6 pb-2">
            <CardTitle className="font-normal">
              <h1 className="font-display text-3xl tracking-tight">Check your email</h1>
            </CardTitle>
            <CardDescription className="text-base">
              We&apos;ve sent a confirmation link to{' '}
              <span className="font-medium text-foreground">{email}</span>.
              Click it to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6">
            <Link href="/seo-audit-login">
              <Button variant="outline" size="lg" className="mt-2 w-full">
                Back to sign in
              </Button>
            </Link>
          </CardContent>
        </Card>
      </AuthSplit>
    )
  }

  return (
    <AuthSplit>
      <Card className="w-full max-w-md py-8">
        <CardHeader className="space-y-2 px-6 text-left">
          <CardTitle className="font-normal">
            <h1 className="font-display text-3xl tracking-tight">Create an account</h1>
          </CardTitle>
          <CardDescription className="text-base">
            Three free HTML audits. Up to 50 pages per Hobby scan. No credit card.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
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
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                aria-invalid={error ? true : undefined}
              />
            </div>

            {error && (
              <p role="alert" className="field-error">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full font-medium" disabled={isLoading}>
              {isLoading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/seo-audit-login" className="text-foreground underline underline-offset-4">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthSplit>
  )
}
