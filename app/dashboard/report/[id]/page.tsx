import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SEOReport } from '@/lib/scanner'
import { ArrowLeft, ArrowRight, Sparkles, Lightbulb, CheckCircle2, AlertCircle, XCircle, LayoutTemplate } from 'lucide-react'
import { ReportHero } from './report-hero'
import { ReportActions } from './report-actions'
import { Badge } from '@/components/ui/badge'

export default async function ReportPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const reportRecord = await prisma.domainReport.findUnique({
    where: { id: id },
  })

  if (!reportRecord || reportRecord.userId !== user.id) {
    redirect('/dashboard')
  }

  const report = JSON.parse(reportRecord.reportData) as SEOReport
  
  // Backwards compatibility check for older legacy single-page reports
  const isLegacy = !report.aggregatedChecks

  // Use pre-sorted checks from the scanner, fallback to empty array
  const sortedChecks = report.aggregatedChecks || []
  const actionPlanItems = report.summary?.topPriorities || sortedChecks.filter(c => c.status !== 'good')

  const score = report.summary?.score ?? (report as SEOReport & { score?: number }).score ?? 0

  return (
    <div className="min-h-screen relative bg-background">
      
      <div className="container relative z-10 mx-auto px-4 sm:px-8 py-10 max-w-4xl print:max-w-none print:py-4 print:px-4">

      <div className="flex justify-between items-center mb-6 print:hidden">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
        <ReportActions report={report} domainUrl={reportRecord.domainUrl} />
      </div>

      <div className="print:hidden">
        <ReportHero
           score={score}
           domain={new URL(report.domain || reportRecord.domainUrl).hostname}
           scannedAt={reportRecord.createdAt.toISOString()}
           domainUrl={reportRecord.domainUrl}
        />
      </div>

      {isLegacy ? (
        <div className="p-8 border border-amber-500/30 bg-amber-500/5 rounded-xl text-center">
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold">Legacy Report Format</h3>
          <p className="text-sm text-muted-foreground mb-4">This report was generated using an older version of our scanner. Rescan the domain for multi-page actionable insights.</p>
          <Link href="/dashboard" className="text-primary hover:underline text-sm font-semibold">Run New Scan</Link>
        </div>
      ) : (
        <div>
          
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5 text-primary" />
              Site-Wide Page Analysis
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-xs font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Page</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {report.pageAnalysis.map((p, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium">{p.path}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${p.score >= 80 ? 'bg-green-500/10 text-green-600' : p.score >= 50 ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'}`}>
                          {p.score}/100
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{p.issuesCount} issues</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Plan Section */}
          {actionPlanItems.length > 0 && (
            <div className="mb-16">
              <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-orange-100 dark:bg-orange-900/50 p-2 rounded-lg">
                    <Lightbulb className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h2 className="text-2xl font-bold">Your Action Plan</h2>
                </div>
                <p className="text-muted-foreground text-sm mb-6 ml-12">Prioritized steps to improve your SEO score</p>

                <div className="space-y-4">
                  {actionPlanItems.map((item, index) => (
                    <div key={'action-' + item.id} className="bg-background rounded-xl p-5 border shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-foreground/70">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-bold text-base">{item.label}</h3>
                            {item.status === 'critical' ? (
                              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900 border-none px-2 py-0 font-bold uppercase text-[10px] tracking-wider">🔥 High</Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-900 border-none px-2 py-0 font-bold uppercase text-[10px] tracking-wider">⚡ Medium</Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4">{item.issueText}</p>

                        <div className="border-l-2 border-primary/20 pl-4 py-1">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">How to Fix</h4>
                          <p className="text-sm leading-relaxed text-foreground/90">
                            {item.howToFix}
                            {item.worstPage && (
                              <span className="inline-block ml-1 opacity-60">(worst: {item.worstPage})</span>
                            )}
                          </p>
                        </div>
                        
                        <div className="mt-4 flex justify-end">
                          <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Analysis Section */}
          <div className="mb-6 flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Detailed Analysis</h2>
          </div>
          
          <p className="text-muted-foreground text-sm mb-8 ml-9">
            A comprehensive breakdown of every metric evaluated during the crawl.
          </p>

          <div className="space-y-12">
            {report.checksByCategory && Object.entries(report.checksByCategory).map(([category, checks]) => {
              if (!checks || checks.length === 0) return null;
              
              return (
                <div key={category} className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest border-b pb-2 mb-4 text-muted-foreground flex items-center justify-between gap-4">
                    {category.replace('-', ' ')}
                    <div className="flex-1 h-px bg-border/40"></div>
                  </h3>
                  
                  <div className="grid gap-4">
                    {checks.map((item) => {
                      const StatusIcon = item.status === 'critical' ? XCircle : 
                                         item.status === 'warning' ? AlertCircle : CheckCircle2;
                                         
                      const statusColor = item.status === 'critical' ? 'text-red-500' :
                                          item.status === 'warning' ? 'text-amber-500' : 'text-green-500';

                      const statusBadgeColor = item.status === 'critical' ? 'bg-red-50 text-red-600 dark:bg-red-950' :
                                               item.status === 'warning' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950' : 'bg-green-50 text-green-600 dark:bg-green-950';

                      return (
                        <div key={item.id} className="rounded-xl border bg-card overflow-hidden shadow-sm transition-all hover:shadow-md group">
                          
                          {/* Header Row */}
                          <div className="flex items-center p-5 cursor-default relative">
                             {/* Subtle highlight line on the left for severe issues */}
                            {item.status !== 'good' && (
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                            )}
                            
                            <StatusIcon className={`h-5 w-5 mr-3 shrink-0 ${statusColor}`} />
                            <h3 className="text-base font-bold flex-1">{item.label}</h3>
                            
                            <Badge variant="secondary" className={`capitalize font-bold text-xs uppercase tracking-wider ${statusBadgeColor}`}>
                              {item.status}
                            </Badge>
                          </div>

                          {/* Expandable Body Area */}
                          <div className="p-5 pt-0 border-t border-border/40 space-y-6 mt-4">
                            
                            {/* Current Value */}
                            <div>
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Current Value</h4>
                              <div className="font-mono text-sm bg-muted/40 px-3 py-2.5 rounded-lg border border-border/40 text-foreground/90 break-all">
                                {item.currentValue}
                              </div>
                            </div>

                            {/* Issue Statement */}
                            <div>
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Issue</h4>
                              <p className="text-sm font-medium text-foreground">{item.issueText}</p>
                            </div>

                            {/* Why It Matters */}
                            <div>
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Why It Matters</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">{item.whyItMatters}</p>
                            </div>

                            {/* How To Fix */}
                            {item.status !== 'good' && (
                              <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">How To Fix</h4>
                                <p className="text-sm text-foreground leading-relaxed mb-3">
                                  {item.howToFix}
                                  {item.worstPage && (
                                     <span className="inline-block ml-1 opacity-60">(worst: {item.worstPage})</span>
                                  )}
                                </p>
                                
                                {/* Snippet block */}
                                {item.snippet && (
                                  <pre className="text-xs bg-slate-950 dark:bg-black text-slate-50 p-4 rounded-lg overflow-x-auto border border-slate-800">
                                    <code>{item.snippet}</code>
                                  </pre>
                                )}
                              </div>
                            )}

                            {/* Good Snippet (sometimes passing objects have snippets to show as examples) */}
                            {item.status === 'good' && item.snippet && (
                               <pre className="text-xs bg-slate-950 dark:bg-black text-slate-50 p-4 rounded-lg overflow-x-auto border border-slate-800">
                                 <code>{item.snippet}</code>
                               </pre>
                            )}

                            {/* Reference Link */}
                            {item.reference && (
                              <div className="pt-2">
                                <a href={item.reference} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1.5 font-semibold">
                                  Read Official Documentation <ArrowRight className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            )}

                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Fallback for old reports without checksByCategory */}
            {!report.checksByCategory && (
               <div className="grid gap-4">
                 {/* Reused map logic for flat array if necessary, omitted for brevity since we expect new schema */}
                 <p className="text-muted-foreground text-sm italic">Categorized mapping not available for this legacy report.</p>
               </div>
            )}
          </div>

        </div>
      )}
      </div>
    </div>
  )
}
