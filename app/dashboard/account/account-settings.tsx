'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-chrome'
import { PaperGlow } from '@/components/seo-art'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label, RequiredMark } from '@/components/ui/label'
import { SignOutButton } from '@/components/sign-out-button'
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULE_HINT,
  mapAuthError,
  passwordsMatchIssue,
} from '@/lib/auth-ui'
import { createClient } from '@/utils/supabase/client'

export function AccountSettings({
  email,
  name,
  planLabel,
  isPro,
  pageCap,
  totalScans,
  scansRemaining,
  memberSince,
}: {
  email: string
  name: string
  planLabel: string
  isPro: boolean
  pageCap: number
  totalScans: number
  scansRemaining: number | null
  memberSince: string
}) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updated, setUpdated] = useState(false)

  const joined = new Date(memberSince).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdated(false)

    const issue = passwordsMatchIssue(password, confirm)
    if (issue) {
      setError(issue)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(mapAuthError(updateError.message, 'reset'))
        setIsLoading(false)
        return
      }

      setPassword('')
      setConfirm('')
      setUpdated(true)
      setIsLoading(false)
    } catch {
      setError(mapAuthError(null, 'reset'))
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader signedIn variant="app" />

      <div className="relative container mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <PaperGlow className="opacity-70" />

        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-2 inline-flex text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to dashboard
          </Link>
          <h1 className="mt-2 font-display text-3xl tracking-tight">Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your email, plan, and password. Nothing else is stored here.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-2xl tracking-tight">Profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Email comes from the sign-in you already use.
            </p>
            <div className="mt-6 space-y-5">
              {name ? (
                <div className="space-y-2">
                  <Label htmlFor="account-name">Name</Label>
                  <Input
                    id="account-name"
                    value={name}
                    readOnly
                    disabled
                    autoComplete="name"
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="account-email">Email</Label>
                <Input
                  id="account-email"
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  autoComplete="email"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Member since {joined}.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-2xl tracking-tight">Plan</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPro
                ? 'Unlimited HTML scans, 500 pages each.'
                : '3 lifetime scans, 50 pages each.'}
            </p>
            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">Current plan</dt>
                <dd className="font-medium">{planLabel}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">Page cap</dt>
                <dd className="font-medium">{pageCap} pages / scan</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">Scans used</dt>
                <dd className="font-medium">
                  {isPro
                    ? `${totalScans} (unlimited)`
                    : `${totalScans} of 3`}
                </dd>
              </div>
              {scansRemaining !== null ? (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted-foreground">Scans left</dt>
                  <dd className="font-medium">{scansRemaining}</dd>
                </div>
              ) : null}
            </dl>
            {!isPro ? (
              <Link href="/pricing" className="mt-6 block">
                <Button size="lg" className="w-full font-medium">
                  Upgrade to Pro — $9/mo
                </Button>
              </Link>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">
                Billing is managed through the checkout email you used to
                subscribe.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-2xl tracking-tight">Password</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Same rule as sign up. {PASSWORD_RULE_HINT}
            </p>
            <form onSubmit={handlePassword} className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-password">
                  New password <RequiredMark />
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder={PASSWORD_RULE_HINT}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                  autoComplete="new-password"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={
                    error ? 'account-password-error' : 'account-password-hint'
                  }
                />
                <p
                  id="account-password-hint"
                  className="text-sm text-muted-foreground"
                >
                  {PASSWORD_RULE_HINT}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  Confirm password <RequiredMark />
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repeat your new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                  autoComplete="new-password"
                  aria-invalid={error ? true : undefined}
                />
              </div>
              {updated && (
                <p role="status" className="text-sm text-accent">
                  Password updated. Use it the next time you sign in.
                </p>
              )}
              {error && (
                <p
                  id="account-password-error"
                  role="alert"
                  className="field-error"
                >
                  {error}
                </p>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full font-medium"
                disabled={isLoading}
              >
                {isLoading ? 'Saving…' : 'Update password'}
              </Button>
            </form>
            <p className="mt-4 text-sm text-muted-foreground">
              Not signed in on this device?{' '}
              <Link
                href="/forgot-password"
                className="text-foreground underline underline-offset-4"
              >
                Request a reset email
              </Link>
              .
            </p>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <h2 className="font-display text-2xl tracking-tight">Sign out</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ends this browser session. Your reports stay on the account.
            </p>
            <div className="mt-6">
              <SignOutButton
                size="lg"
                variant="outline"
                className="w-full font-medium"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
