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
import { AuthSplit } from '@/components/auth-split'
import { FORGOT_SUCCESS_MESSAGE } from '@/lib/auth-ui'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {
      // Always show the same confirmation so the form cannot crash.
    } finally {
      setSent(true)
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthSplit>
        <Card className="w-full max-w-md py-8 text-center">
          <CardHeader className="space-y-2 px-6 pb-2">
            <CardTitle className="font-normal">
              <h1 className="font-display text-3xl tracking-tight">
                Check your email
              </h1>
            </CardTitle>
            <CardDescription className="text-base">
              {FORGOT_SUCCESS_MESSAGE}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-6">
            <p className="text-sm text-muted-foreground">
              The link expires in one hour. You can close this tab.
            </p>
            <Link href="/seo-audit-login">
              <Button variant="outline" size="lg" className="w-full">
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
            <h1 className="font-display text-3xl tracking-tight">
              Forgot your password?
            </h1>
          </CardTitle>
          <CardDescription className="text-base">
            Enter the email on your SeoBoost account. If it matches, we will
            send a reset link that expires in one hour.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <form onSubmit={handleSubmit} className="space-y-5">
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
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Remembered it?{' '}
            <Link
              href="/seo-audit-login"
              className="text-foreground underline underline-offset-4"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthSplit>
  )
}
