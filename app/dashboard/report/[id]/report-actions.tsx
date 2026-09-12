'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SEOReport } from '@/lib/scanner'
import { buildEditorFixPrompt, findingsFromAggregated } from '@/lib/llm-export'

interface ReportActionsProps {
  report: SEOReport
  domainUrl: string
}

export function ReportActions({ report, domainUrl }: ReportActionsProps) {
  const [copied, setCopied] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  const handleCopyPrompt = () => {
    const prompt = buildEditorFixPrompt({
      siteUrl: domainUrl,
      score: report.summary?.score,
      grade: report.summary?.grade,
      pagesCrawled: report.coverage?.crawled ?? report.pagesScanned,
      pageCap: report.coverage?.cap,
      findings: findingsFromAggregated(report.aggregatedChecks ?? []),
    })

    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:gap-3 print:hidden">
      <Button
        variant="outline"
        size="sm"
        className="flex-1 sm:flex-none"
        onClick={handlePrint}
      >
        Export PDF
      </Button>
      <Button size="sm" className="flex-1 sm:flex-none" onClick={handleCopyPrompt}>
        {copied ? 'Copied' : 'Copy fix prompt'}
      </Button>
    </div>
  )
}
