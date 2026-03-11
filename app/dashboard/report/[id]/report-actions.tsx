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

    if (!report.title.pass)
      failures.push(`- **Title Tag**: ${report.title.message}`)
    if (!report.description.pass)
      failures.push(`- **Meta Description**: ${report.description.message}`)
    if (!report.h1.pass)
      failures.push(`- **H1 Tag**: ${report.h1.message}`)
    if (!report.images.pass)
      failures.push(`- **Images**: ${report.images.message}`)
    if (!report.content?.pass)
      failures.push(`- **Content Volume**: ${report.content?.message}`)
    if (!report.technical?.pass) {
      if (!report.technical?.hasViewport)
        failures.push(`- **Missing Viewport Meta**: Add <meta name="viewport" content="width=device-width, initial-scale=1">`)
      if (!report.technical?.hasFavicon)
        failures.push(`- **Missing Favicon**: Add a favicon.ico or <link rel="icon">`)
      if (!report.technical?.isIndexable)
        failures.push(`- **Noindex Detected**: Remove noindex robots meta tag to allow indexing`)
    }
    if (!report.socialTags?.pass)
      failures.push(`- **Social Tags (OG/Twitter)**: ${report.socialTags?.message}`)
    if (!report.semanticHtml?.pass)
      failures.push(`- **Semantic HTML**: ${report.semanticHtml?.message}`)
    if (!report.structuredData?.pass)
      failures.push(`- **Structured Data**: ${report.structuredData?.message}`)

    const prompt = `You are an expert SEO Engineer and developer. I ran a technical SEO audit on ${domainUrl} and received a health score of ${report.score}/100.

Here are the specific issues that need to be fixed:

${failures.join('\n')}

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
