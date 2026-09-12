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
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AuthSplit } from '@/components/auth-split'
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULE_HINT,
  mapAuthError,
  passwordsMatchIssue,
} from '@/lib/auth-ui'
import { inspectPasswordRecoveryUrl } from '@/lib/password-reset'
import { createClient } from '@/utils/supabase/client'

function cleanResetUrl() {
  if (window.location.search || window.location.hash) {
    window.history.replaceState({}, '', '/reset-password')
  }
}

export function ResetPasswordForm() {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid'>(
    'checking'
  )
  const [invalidKind, setInvalidKind] = useState<'missing' | 'expired'>(
    'expired'
  )
  const [invalidCopy, setInvalidCopy] = useState(
    'This reset link is invalid or has expired. Request a new one from the sign-in page.'
  )
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let settled = false
    const supabase = createClient()
    const hint = inspectPasswordRecoveryUrl(window.location.href)

    const markReady = () => {
      if (cancelled || settled) return
      settled = true
      cleanResetUrl()
      setStatus('ready')
    }

    const markInvalid = (copy: string, kind: 'missing' | 'expired' = 'expired') => {
      if (cancelled || settled) return
      settled = true
      setInvalidKind(kind)
      setInvalidCopy(copy)
      setStatus('invalid')
    }

    if (hint.kind === 'error') {
      markInvalid(
        mapAuthError(hint.message, 'reset')
      )
      return
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) markReady()
    })

    ;(async () => {
      if (hint.kind === 'pkce') {
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(hint.code)
        if (data.session) {
          markReady()
          return
        }
        const existing = await supabase.auth.getSession()
        if (existing.data.session) {
          markReady()
          return
        }
        markInvalid(mapAuthError(exchangeError?.message, 'reset'))
        return
      }

      if (hint.kind === 'otp') {
        const { data, error: otpError } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash: hint.tokenHash,
        })
        if (data.session) {
          markReady()
          return
        }
        markInvalid(mapAuthError(otpError?.message, 'reset'))
        return
      }

      if (hint.kind === 'hash') {
        const first = await supabase.auth.getSession()
        if (first.data.session) {
          markReady()
          return
        }
        await new Promise((resolve) => setTimeout(resolve, 400))
        const again = await supabase.auth.getSession()
        if (again.data.session) {
          markReady()
          return
        }
        markInvalid(
          'This reset link is invalid or has expired. Request a new one from the sign-in page.'
        )
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 800))
      if (!settled) {
        markInvalid(
          'Open the reset link from your email to choose a new password. This page cannot set a password on its own.',
          'missing'
        )
      }
    })()

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status !== 'ready') return

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

      await supabase.auth.signOut()
      router.push('/seo-audit-login?reset=1')
    } catch {
      setError(mapAuthError(null, 'reset'))
      setIsLoading(false)
    }
  }

  if (status === 'checking') {
    return (
      <AuthSplit>
        <Card className="w-full max-w-md py-8">
          <CardHeader className="space-y-2 px-6 text-left">
            <CardTitle className="font-normal">
              <h1 className="font-display text-3xl tracking-tight">
                Checking reset link
              </h1>
            </CardTitle>
            <CardDescription className="text-base">
              Hang on while we confirm this reset link.
            </CardDescription>
          </CardHeader>
        </Card>
      </AuthSplit>
    )
  }

  if (status === 'invalid') {
    return (
      <AuthSplit>
        <Card className="w-full max-w-md py-8">
          <CardHeader className="space-y-2 px-6 text-left">
            <CardTitle className="font-normal">
              <h1 className="font-display text-3xl tracking-tight">
                {invalidKind === 'missing'
                  ? 'Need a reset link'
                  : 'Reset link expired'}
              </h1>
            </CardTitle>
            <CardDescription className="text-base">
              {invalidCopy}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-6">
            <p role="alert" className="field-error">
              {invalidCopy}
            </p>
            <Link href="/forgot-password">
              <Button size="lg" className="w-full font-medium">
                Request a new link
              </Button>
            </Link>
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
              Choose a new password
            </h1>
          </CardTitle>
          <CardDescription className="text-base">
            {PASSWORD_RULE_HINT} After you save it, sign in with the new
            password.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">
                New password <RequiredMark />
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={PASSWORD_RULE_HINT}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={PASSWORD_MIN_LENGTH}
                autoComplete="new-password"
                aria-invalid={error ? true : undefined}
                aria-describedby={
                  error ? 'reset-error' : 'reset-password-hint'
                }
              />
              <p id="reset-password-hint" className="text-sm text-muted-foreground">
                Same rule as sign up: {PASSWORD_RULE_HINT.toLowerCase()}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">
                Confirm password <RequiredMark />
              </Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Repeat your new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={PASSWORD_MIN_LENGTH}
                autoComplete="new-password"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'reset-error' : undefined}
              />
            </div>

            {error && (
              <p id="reset-error" role="alert" className="field-error">
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
        </CardContent>
      </Card>
    </AuthSplit>
  )
}
