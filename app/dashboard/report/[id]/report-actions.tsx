'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Printer, Copy, Check } from 'lucide-react'
import { SEOReport } from '@/lib/scanner'

interface ReportActionsProps {
  report: SEOReport
  domainUrl: string
}

export function ReportActions({ report, domainUrl }: ReportActionsProps) {
  const [copied, setCopied] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  // Generates a descriptive prompt for LLMs based on diagnostic failures
  const handleCopyPrompt = () => {
    const failures: string[] = []

    if (report.aggregatedChecks) {
      // New Multi-Page Schema
      report.aggregatedChecks.filter(c => c.status !== 'good').forEach(c => {
        let text = `- **${c.label}**: ${c.issueText}`
        if (c.worstPage) text += ` (Affected target: ${c.worstPage})`
        failures.push(text)
      })
    } else {
      // Fallback for legacy database records
      // @ts-expect-error - legacy shape
      if (!report.title?.pass) failures.push(`- **Title Tag**: ${report.title?.message}`)
      // @ts-expect-error - legacy shape
      if (!report.description?.pass) failures.push(`- **Meta Description**: ${report.description?.message}`)
      // @ts-expect-error - legacy shape
      if (!report.h1?.pass) failures.push(`- **H1 Tag**: ${report.h1?.message}`)
      // @ts-expect-error - legacy shape
      if (!report.images?.pass) failures.push(`- **Images**: ${report.images?.message}`)
      // @ts-expect-error - legacy shape
      if (!report.content?.pass) failures.push(`- **Content Volume**: ${report.content?.message}`)
      // @ts-expect-error - legacy shape
      if (!report.technical?.pass) failures.push(`- **Technical Meta**: Missing essential meta tags.`)
    }

    const score = report.summary?.score ?? (report as SEOReport & { score?: number }).score ?? 0

    if (failures.length === 0) {
      navigator.clipboard.writeText(`This domain (${domainUrl}) scored ${score}/100 and no critical SEO issues were found. Excellent work!`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      return
    }

    const prompt = `You are an expert SEO Engineer and developer. I ran a technical SEO audit on ${domainUrl} and received a health score of ${score}/100.

Here are the specific issues that need to be fixed:

${failures.join('\\n')}

For each issue above, provide:
1. A clear explanation of why it matters for SEO
2. The exact code snippet to fix it (use Next.js/React where applicable)
3. Where in the codebase to place the fix

Be specific and actionable. Focus only on the failed checks listed above.`

    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="flex gap-3 print:hidden">
      <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
        <Printer className="w-4 h-4" />
        Export PDF
      </Button>
      <Button size="sm" onClick={handleCopyPrompt} className="gap-2">
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy as LLM Prompt'}
      </Button>
    </div>
  )
}
