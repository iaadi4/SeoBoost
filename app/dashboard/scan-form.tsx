'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, Loader2 } from 'lucide-react'

export function ScanForm() {
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!inputRef.current) return

    let value = inputRef.current.value.trim()
    if (!value) return

    // Prepend https:// if no protocol present
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      value = `https://${value}`
    }

    setIsLoading(true)

    // Use native form submission with corrected value
    const form = formRef.current!
    const hiddenInput = document.createElement('input')
    hiddenInput.type = 'hidden'
    hiddenInput.name = 'url'
    hiddenInput.value = value
    form.appendChild(hiddenInput)
    // Remove the visible input so we don't send a duplicate
    inputRef.current.name = ''
    form.submit()
  }

  return (
    <form
      ref={formRef}
      action="/api/scan"
      method="POST"
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3"
    >
      {/* Prefix + input combined pill */}
      <div className="relative flex-1 flex items-center rounded-xl border border-border bg-muted/40 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all duration-200">
        <span className="pl-4 pr-1 text-sm text-muted-foreground select-none whitespace-nowrap font-mono">
          https://
        </span>
        <input
          ref={inputRef}
          placeholder="example.com"
          className="flex-1 bg-transparent py-3 pr-4 text-base outline-none placeholder:text-muted-foreground/50 text-foreground"
          required
          disabled={isLoading}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="h-12 px-8 rounded-xl shrink-0 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-200 gap-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Scanning...
          </>
        ) : (
          <>
            Analyze
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  )
}
