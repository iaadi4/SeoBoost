'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label, RequiredMark } from '@/components/ui/label'

function normalizeSiteUrl(raw: string) {
  const value = raw.trim()
  if (!value) return null
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(withProtocol)
    if (!url.hostname.includes('.')) return null
    return url.toString()
  } catch {
    return null
  }
}

function HeroScanForm({ signedIn }: { signedIn: boolean }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const errorId = 'hero-url-error'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const next = normalizeSiteUrl(value)
    if (!next) {
      setError(
        value.trim()
          ? 'Enter a valid website URL, like example.com'
          : 'Enter a website URL to scan'
      )
      return
    }

    setError(null)
    setIsSubmitting(true)

    if (signedIn) {
      const form = e.currentTarget
      const hidden = document.createElement('input')
      hidden.type = 'hidden'
      hidden.name = 'url'
      hidden.value = next
      form.appendChild(hidden)
      form.submit()
      return
    }

    window.location.href = `/sign-up?url=${encodeURIComponent(next)}`
  }

  return (
    <form
      action={signedIn ? '/api/scan' : undefined}
      method={signedIn ? 'POST' : undefined}
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto mt-10 w-full max-w-xl text-left"
    >
      <Label htmlFor="website-url" className="mb-2">
        Website URL <RequiredMark />
      </Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          id="website-url"
          type="text"
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          placeholder="example.com"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError(null)
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : 'website-url-hint'}
          required
          disabled={isSubmitting}
          className="flex-1"
        />
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full shrink-0 sm:w-auto">
          {isSubmitting ? 'Starting…' : 'Start free scan'}
        </Button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="field-error mt-3">
          {error}
        </p>
      ) : (
        <p id="website-url-hint" className="mt-3 text-sm text-muted-foreground">
          No credit card. 3 free scans after you create an account.
        </p>
      )}
    </form>
  )
}

export function HeroAnimations({
  children,
  signedIn = false,
}: {
  children?: React.ReactNode
  signedIn?: boolean
}) {
  return (
    <>
      {children}
      <HeroScanForm signedIn={signedIn} />
    </>
  )
}
