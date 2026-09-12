'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SEOReport } from '@/lib/scanner'
import { LLM_EXPORT_DO_NOT, sanitizeAuditText } from '@/lib/llm-export'

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
    const failures: string[] = []

    if (report.aggregatedChecks) {
      report.aggregatedChecks
        .filter((c) => c.status !== 'good')
        .forEach((c) => {
          let text = `- **${c.label}**: ${sanitizeAuditText(c.issueText)}`
          if (c.howToFix) text += `\n  Fix: ${sanitizeAuditText(c.howToFix)}`
          if (c.worstPage) text += ` (Affected target: ${c.worstPage})`
          failures.push(text)
        })
    } else {
      const legacy = report as SEOReport & {
        title?: { pass?: boolean; message?: string }
        description?: { pass?: boolean; message?: string }
        h1?: { pass?: boolean; message?: string }
        images?: { pass?: boolean; message?: string }
        content?: { pass?: boolean; message?: string }
        technical?: { pass?: boolean }
      }
      if (!legacy.title?.pass) failures.push(`- **Title Tag**: ${legacy.title?.message}`)
      if (!legacy.description?.pass)
        failures.push(`- **Meta Description**: ${legacy.description?.message}`)
      if (!legacy.h1?.pass) failures.push(`- **H1 Tag**: ${legacy.h1?.message}`)
      if (!legacy.images?.pass) failures.push(`- **Images**: ${legacy.images?.message}`)
      if (!legacy.content?.pass)
        failures.push(`- **Content Volume**: ${legacy.content?.message}`)
      if (!legacy.technical?.pass)
        failures.push(`- **Technical Meta**: Missing essential meta tags.`)
    }

    const score =
      report.summary?.score ?? (report as SEOReport & { score?: number }).score ?? 0

    if (failures.length === 0) {
      navigator.clipboard.writeText(
        `This domain (${domainUrl}) scored ${score}/100 and no critical SEO issues were found.`
      )
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      return
    }

    const prompt = `You are an expert SEO Engineer and developer. I ran a technical SEO audit on ${domainUrl} and received a health score of ${score}/100.

Here are the specific issues that need to be fixed:

${failures.join('\n')}

For each issue above, provide:
1. A clear explanation of why it matters for SEO
2. The exact code snippet to fix it (use Next.js/React generateMetadata and RSC where applicable)
3. Where in the codebase to place the fix

${LLM_EXPORT_DO_NOT}

Be specific and actionable. Focus only on the failed checks listed above.`

    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="flex gap-3 print:hidden">
      <Button variant="outline" size="sm" onClick={handlePrint}>
        Export PDF
      </Button>
      <Button size="sm" onClick={handleCopyPrompt}>
        {copied ? 'Copied' : 'Copy as LLM prompt'}
      </Button>
    </div>
  )
}
