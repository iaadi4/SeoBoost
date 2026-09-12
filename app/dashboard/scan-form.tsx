'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label, RequiredMark } from '@/components/ui/label'

export function ScanForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorId = 'scan-url-error'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const raw = String(new FormData(form).get('url') || '').trim()

    if (!raw) {
      setError('Enter a website URL to scan')
      return
    }

    const value =
      raw.startsWith('http://') || raw.startsWith('https://')
        ? raw
        : `https://${raw}`

    try {
      const parsed = new URL(value)
      if (!parsed.hostname.includes('.')) {
        setError('Enter a valid website URL, like example.com')
        return
      }
    } catch {
      setError('Enter a valid website URL, like example.com')
      return
    }

    setError(null)
    setIsLoading(true)

    const visible = form.elements.namedItem('url') as HTMLInputElement | null
    if (visible) visible.name = ''
    const hiddenInput = document.createElement('input')
    hiddenInput.type = 'hidden'
    hiddenInput.name = 'url'
    hiddenInput.value = value
    form.appendChild(hiddenInput)
    form.submit()
  }

  return (
    <form
      action="/api/scan"
      method="POST"
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-3"
    >
      <Label htmlFor="scan-url">
        Website URL <RequiredMark />
      </Label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          id="scan-url"
          name="url"
          type="text"
          inputMode="url"
          placeholder="example.com"
          required
          disabled={isLoading}
          autoComplete="url"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="flex-1"
        />
        <Button type="submit" size="lg" className="shrink-0" disabled={isLoading}>
          {isLoading ? 'Scanning…' : 'Analyze'}
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="field-error">
          {error}
        </p>
      )}
    </form>
  )
}
