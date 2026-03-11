import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  CheckCircle2,
  Link as LinkIcon,
  AlertCircle,
  XCircle,
  Type,
  ImageIcon,
  FileText,
  Code,
  Share2,
  LayoutTemplate,
  Database,
  TrendingDown,
} from 'lucide-react'
import Link from 'next/link'
import { SEOReport } from '@/lib/scanner'
import { ReportActions } from './report-actions'

function PassBadge({ pass, partial }: { pass: boolean; partial?: boolean }) {
  if (pass) return <Badge className="bg-green-500 hover:bg-green-600 text-white shrink-0">Passed</Badge>
  if (partial) return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 shrink-0">Incomplete</Badge>
  return <Badge variant="destructive" className="shrink-0">Needs Fix</Badge>
}

function StatusIcon({ pass }: { pass: boolean }) {
  if (pass) return <CheckCircle2 className="h-5 w-5 text-green-500" />
  return <AlertCircle className="h-5 w-5 text-red-500" />
}

function CheckRow({ label, ok, note }: { label: string; ok: boolean; note?: string }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border text-sm ${ok ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
      <div className="flex items-center gap-2">
        {ok ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
        <span className="font-medium">{label}</span>
        {note && <span className="text-muted-foreground text-xs hidden sm:inline">— {note}</span>}
      </div>
      <span className={`text-xs font-bold ${ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{ok ? 'OK' : 'FAIL'}</span>
    </div>
  )
}

export default async function ReportPage(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const reportRecord = await prisma.domainReport.findUnique({
    where: { id: params.id },
  })

  if (!reportRecord || reportRecord.userId !== user.id) redirect('/dashboard')

  const report: SEOReport = JSON.parse(reportRecord.reportData)
  const domainHost = new URL(reportRecord.domainUrl).hostname

  const scoreColor =
    report.score >= 80
      ? 'text-green-600 dark:text-green-400'
      : report.score >= 50
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-red-600 dark:text-red-400'

  const scoreBorder =
    report.score >= 80
      ? 'border-green-500/50 bg-green-500/5'
      : report.score >= 50
        ? 'border-yellow-500/50 bg-yellow-500/5'
        : 'border-red-500/50 bg-red-500/5'

  // Build deductions list for score breakdown
  const deductions: { label: string; pts: number }[] = []
  if (!report.title.pass) deductions.push({ label: 'Title Tag', pts: 10 })
  if (!report.description.pass) deductions.push({ label: 'Meta Description', pts: 10 })
  if (!report.h1.pass) deductions.push({ label: 'H1 Heading', pts: 10 })
  if (!report.images.pass) deductions.push({ label: 'Image Alt Text', pts: 10 })
  if (!report.content?.pass) deductions.push({ label: 'Content Volume', pts: 10 })
  if (!report.technical?.hasViewport) deductions.push({ label: 'Viewport Meta', pts: 5 })
  if (!report.technical?.hasFavicon) deductions.push({ label: 'Favicon', pts: 5 })
  if (!report.technical?.isIndexable) deductions.push({ label: 'Indexability (noindex)', pts: 15 })
  if (!report.socialTags?.pass) deductions.push({ label: 'Social Tags (OG/Twitter)', pts: 10 })
  if (!report.semanticHtml?.pass) deductions.push({ label: 'Semantic HTML5', pts: 10 })
  if (!report.structuredData?.pass) deductions.push({ label: 'Structured Data (JSON-LD)', pts: 10 })

  return (
    <div className="container mx-auto px-4 sm:px-8 py-10 max-w-4xl print:max-w-none print:py-4 print:px-4">

      {/* Nav bar — hidden in print */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
        <ReportActions report={report} domainUrl={reportRecord.domainUrl} />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 print:mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            SEO Audit: <span className="text-primary">{domainHost}</span>
          </h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2 flex-wrap">
            Scanned on {new Date(reportRecord.createdAt).toLocaleString()}
            <a
              href={reportRecord.domainUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline inline-flex items-center print:hidden"
            >
              Visit site <LinkIcon className="ml-1 h-3 w-3" />
            </a>
          </p>
        </div>
        <Card className={`shrink-0 border-2 w-full md:w-auto text-center ${scoreBorder}`}>
          <CardContent className="pt-4 px-10 pb-4">
            <div className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-widest">
              Health Score
            </div>
            <div className={`text-7xl font-black tabular-nums ${scoreColor}`}>
              {report.score}
            </div>
            <div className="text-xs text-muted-foreground mt-1">out of 100</div>
          </CardContent>
        </Card>
      </div>

      {/* Score Breakdown — only if there are deductions */}
      {deductions.length > 0 && (
        <Card className="mb-6 border-yellow-500/30 bg-yellow-500/5 print:mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingDown className="h-5 w-5 text-yellow-600" />
              Score Breakdown — Where Points Were Lost
            </CardTitle>
            <CardDescription>
              These checks failed and reduced your score from 100.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {deductions.map((d) => (
                <div key={d.label} className="flex items-center justify-between text-sm p-2 rounded-md bg-background border">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <span>{d.label}</span>
                  </div>
                  <span className="font-bold text-red-600 dark:text-red-400">−{d.pts} pts</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t">
                <span>Final Score</span>
                <span className={scoreColor}>{report.score} / 100</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <h2 className="text-xl font-bold mb-4">Detailed Analysis</h2>

      <div className="grid gap-5">

        {/* ── 1. Title Tag ─────────────────────────────────── */}
        <Card className={report.title.pass ? 'border-green-500/20' : 'border-red-500/20'}>
          <CardHeader className="flex flex-row items-center gap-3 pb-2 space-y-0">
            <StatusIcon pass={report.title.pass} />
            <CardTitle className="text-lg flex items-center gap-2 flex-1">
              <Type className="h-4 w-4 text-muted-foreground" /> Title Tag
            </CardTitle>
            <PassBadge pass={report.title.pass} />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{report.title.message}</p>
            {!report.title.pass && (
              <div className="mb-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                <strong>How to fix:</strong> Update your <code className="bg-muted px-1 rounded">&lt;title&gt;</code> tag to be between 30–65 characters. Include your primary keyword near the beginning. Example: <code className="bg-muted px-1 rounded">&lt;title&gt;Keyword-Rich Page Title | Brand&lt;/title&gt;</code>
              </div>
            )}
            <div className="bg-muted p-3 rounded-lg font-mono text-sm break-all border">
              {report.title.value || <span className="italic text-muted-foreground">No title found</span>}
            </div>
            <div className="mt-2 text-xs flex justify-between text-muted-foreground">
              <span>{report.title.value.length} chars</span>
              <span>Target: 30–65 chars</span>
            </div>
            <Progress value={Math.min(100, (report.title.value.length / 65) * 100)} className="h-1.5 mt-1" />
          </CardContent>
        </Card>

        {/* ── 2. Meta Description ──────────────────────────── */}
        <Card className={report.description.pass ? 'border-green-500/20' : 'border-red-500/20'}>
          <CardHeader className="flex flex-row items-center gap-3 pb-2 space-y-0">
            <StatusIcon pass={report.description.pass} />
            <CardTitle className="text-lg flex items-center gap-2 flex-1">
              <FileText className="h-4 w-4 text-muted-foreground" /> Meta Description
            </CardTitle>
            <PassBadge pass={report.description.pass} />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{report.description.message}</p>
            {!report.description.pass && (
              <div className="mb-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                <strong>How to fix:</strong> Add a <code className="bg-muted px-1 rounded">&lt;meta name=&quot;description&quot; content=&quot;...&quot;&gt;</code> tag with a compelling, keyword-rich summary between 70–160 characters. This text appears in Google search results under your page title.
              </div>
            )}
            <div className="bg-muted p-3 rounded-lg font-mono text-sm break-all border">
              {report.description.value || <span className="italic text-muted-foreground">No description found</span>}
            </div>
            <div className="mt-2 text-xs flex justify-between text-muted-foreground">
              <span>{report.description.value.length} chars</span>
              <span>Target: 70–160 chars</span>
            </div>
            <Progress value={Math.min(100, (report.description.value.length / 160) * 100)} className="h-1.5 mt-1" />
          </CardContent>
        </Card>

        {/* ── 3. H1 & Heading ──────────────────────────────── */}
        <Card className={report.h1.pass ? 'border-green-500/20' : 'border-red-500/20'}>
          <CardHeader className="flex flex-row items-center gap-3 pb-2 space-y-0">
            <StatusIcon pass={report.h1.pass} />
            <CardTitle className="text-lg flex items-center gap-2 flex-1">
              <span className="font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded text-xs">&lt;h1&gt;</span> Heading Structure
            </CardTitle>
            <PassBadge pass={report.h1.pass} />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{report.h1.message}</p>
            {!report.h1.pass && (
              <div className="mb-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                <strong>How to fix:</strong>{' '}
                {report.h1.count === 0
                  ? 'Add exactly one <h1> tag to your page containing your primary keyword. Every page must have one H1 as its main topic signal for search engines.'
                  : 'Remove extra <h1> tags — only one is allowed per page. Demote additional headings to <h2> or <h3>.'}
              </div>
            )}
            {report.h1.value && (
              <div className="bg-muted p-3 rounded-lg font-mono text-sm break-all border mb-3">
                {report.h1.value}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              Found <strong className={report.h1.count === 1 ? 'text-green-500' : 'text-red-500'}>{report.h1.count}</strong> H1 tag{report.h1.count !== 1 ? 's' : ''} on this page. Best practice: exactly 1.
            </div>
          </CardContent>
        </Card>

        {/* ── 4. Images ────────────────────────────────────── */}
        <Card className={report.images.pass ? 'border-green-500/20' : 'border-red-500/20'}>
          <CardHeader className="flex flex-row items-center gap-3 pb-2 space-y-0">
            <StatusIcon pass={report.images.pass} />
            <CardTitle className="text-lg flex items-center gap-2 flex-1">
              <ImageIcon className="h-4 w-4 text-muted-foreground" /> Image Optimization
            </CardTitle>
            <PassBadge pass={report.images.pass} />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{report.images.message}</p>
            {!report.images.pass && (
              <div className="mb-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                <strong>How to fix:</strong> Add an <code className="bg-muted px-1 rounded">alt</code> attribute to every <code className="bg-muted px-1 rounded">&lt;img&gt;</code> tag describing what the image shows. Example: <code className="bg-muted px-1 rounded">&lt;img src=&quot;hero.jpg&quot; alt=&quot;Dashboard showing SEO health score&quot; /&gt;</code>. Alt text helps search engines index your images and improves accessibility.
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg text-center border">
                <div className="text-2xl font-bold">{report.images.total}</div>
                <div className="text-xs text-muted-foreground uppercase mt-1">Total Images</div>
              </div>
              <div className={`p-4 rounded-lg text-center border ${report.images.missingAlt > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
                <div className={`text-2xl font-bold ${report.images.missingAlt > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {report.images.missingAlt}
                </div>
                <div className="text-xs text-muted-foreground uppercase mt-1">Missing Alt Text</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 5. Content Volume ────────────────────────────── */}
        <Card className={report.content?.pass ? 'border-green-500/20' : 'border-red-500/20'}>
          <CardHeader className="flex flex-row items-center gap-3 pb-2 space-y-0">
            <StatusIcon pass={report.content?.pass ?? false} />
            <CardTitle className="text-lg flex items-center gap-2 flex-1">
              <FileText className="h-4 w-4 text-muted-foreground" /> Content Volume
            </CardTitle>
            <PassBadge pass={report.content?.pass ?? false} />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{report.content?.message}</p>
            {!report.content?.pass && (
              <div className="mb-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                <strong>How to fix:</strong> Expand your page content to at least 300 words. Add meaningful paragraphs, a detailed product/service description, FAQs, or a blog section. Thin content is a strong negative ranking signal — Google prefers comprehensive pages that fully cover a topic.
              </div>
            )}
            <div className="bg-muted p-4 rounded-lg border flex flex-col items-center">
              <span className="text-4xl font-black">{report.content?.wordCount || 0}</span>
              <span className="text-xs text-muted-foreground uppercase mt-1">Words Detected</span>
            </div>
            <Progress value={Math.min(100, ((report.content?.wordCount || 0) / 500) * 100)} className="h-1.5 mt-3" />
            <p className="text-xs text-center text-muted-foreground mt-1">Target: 300+ words for strong rankings</p>
          </CardContent>
        </Card>

        {/* ── 6. Technical Core Tags ───────────────────────── */}
        <Card className={report.technical?.pass ? 'border-green-500/20' : 'border-red-500/20'}>
          <CardHeader className="flex flex-row items-center gap-3 pb-2 space-y-0">
            <StatusIcon pass={report.technical?.pass ?? false} />
            <CardTitle className="text-lg flex items-center gap-2 flex-1">
              <Code className="h-4 w-4 text-muted-foreground" /> Technical Core Tags
            </CardTitle>
            <PassBadge pass={report.technical?.pass ?? false} />
          </CardHeader>
          <CardContent>
            {!report.technical?.isIndexable && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4 text-sm font-semibold">
                🚨 CRITICAL: noindex detected — search engines cannot index this page!
              </div>
            )}
            <div className="grid gap-2">
              <CheckRow label="Viewport Meta Tag" ok={report.technical?.hasViewport ?? false} note='<meta name="viewport" ...>' />
              <CheckRow label="Indexable by Search Engines" ok={report.technical?.isIndexable ?? false} note="No noindex directive" />
              <CheckRow label="Favicon Defined" ok={report.technical?.hasFavicon ?? false} note="<link rel=icon>" />
            </div>
            {!report.technical?.pass && (
              <div className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <strong>How to fix:</strong>
                {!report.technical?.hasViewport && <p>• Add <code className="bg-muted px-1 rounded">&lt;meta name=&quot;viewport&quot; content=&quot;width=device-width, initial-scale=1&quot;&gt;</code> inside your <code className="bg-muted px-1 rounded">&lt;head&gt;</code> for mobile responsiveness.</p>}
                {!report.technical?.isIndexable && <p>• Remove <code className="bg-muted px-1 rounded">noindex</code> from your robots meta tag or <code className="bg-muted px-1 rounded">X-Robots-Tag</code> header so search engines can crawl this page.</p>}
                {!report.technical?.hasFavicon && <p>• Add <code className="bg-muted px-1 rounded">&lt;link rel=&quot;icon&quot; href=&quot;/favicon.ico&quot;&gt;</code> to your <code className="bg-muted px-1 rounded">&lt;head&gt;</code>, or place a <code className="bg-muted px-1 rounded">favicon.ico</code> in the <code className="bg-muted px-1 rounded">/public</code> folder.</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── 7. Social Sharing Tags ───────────────────────── */}
        <Card className={report.socialTags?.pass ? 'border-green-500/20' : 'border-yellow-500/20'}>
          <CardHeader className="flex flex-row items-center gap-3 pb-2 space-y-0">
            <StatusIcon pass={report.socialTags?.pass ?? false} />
            <CardTitle className="text-lg flex items-center gap-2 flex-1">
              <Share2 className="h-4 w-4 text-muted-foreground" /> Social Sharing (OpenGraph & Twitter)
            </CardTitle>
            <PassBadge pass={report.socialTags?.pass ?? false} partial />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{report.socialTags?.message}</p>
            <div className="grid gap-2">
              <CheckRow label="og:title" ok={report.socialTags?.hasOGTitle ?? false} note="OpenGraph title for social shares" />
              <CheckRow label="og:description" ok={report.socialTags?.hasOGDescription ?? false} note="OpenGraph description" />
              <CheckRow label="og:image" ok={report.socialTags?.hasOGImage ?? false} note="Social share image (1200×630px)" />
              <CheckRow label="twitter:card" ok={report.socialTags?.hasTwitterCard ?? false} note="Twitter card type" />
            </div>
            {!report.socialTags?.pass && (
              <div className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                <strong>How to fix:</strong> Add these tags inside your <code className="bg-muted px-1 rounded">&lt;head&gt;</code>. In Next.js, use the <code className="bg-muted px-1 rounded">metadata</code> export with an <code className="bg-muted px-1 rounded">openGraph</code> object, or add them manually as <code className="bg-muted px-1 rounded">&lt;meta property=&quot;og:title&quot; content=&quot;...&quot;&gt;</code> etc. An og:image should be 1200×630px and an absolute URL.
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── 8. Semantic HTML ─────────────────────────────── */}
        <Card className={report.semanticHtml?.pass ? 'border-green-500/20' : 'border-yellow-500/20'}>
          <CardHeader className="flex flex-row items-center gap-3 pb-2 space-y-0">
            <StatusIcon pass={report.semanticHtml?.pass ?? false} />
            <CardTitle className="text-lg flex items-center gap-2 flex-1">
              <LayoutTemplate className="h-4 w-4 text-muted-foreground" /> Semantic HTML5 Structure
            </CardTitle>
            <PassBadge pass={report.semanticHtml?.pass ?? false} partial />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{report.semanticHtml?.message}</p>
            <div className="grid gap-2">
              <CheckRow label="<main> element" ok={report.semanticHtml?.hasMain ?? false} note="Primary content wrapper" />
              <CheckRow label="<header> element" ok={report.semanticHtml?.hasHeader ?? false} note="Site header landmark" />
              <CheckRow label="<nav> element" ok={report.semanticHtml?.hasNav ?? false} note="Navigation landmark" />
              <CheckRow label="<footer> element" ok={report.semanticHtml?.hasFooter ?? false} note="Page footer" />
            </div>
            {!report.semanticHtml?.pass && (
              <div className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                <strong>How to fix:</strong> Wrap your page sections with the correct HTML5 landmark elements. Use <code className="bg-muted px-1 rounded">&lt;header&gt;</code> for the site header, <code className="bg-muted px-1 rounded">&lt;nav&gt;</code> for navigation menus, <code className="bg-muted px-1 rounded">&lt;main&gt;</code> around your primary content, and <code className="bg-muted px-1 rounded">&lt;footer&gt;</code> at the bottom. These are used by search engines to understand your page structure.
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── 9. Structured Data ───────────────────────────── */}
        <Card className={report.structuredData?.pass ? 'border-green-500/20' : 'border-yellow-500/20'}>
          <CardHeader className="flex flex-row items-center gap-3 pb-2 space-y-0">
            <StatusIcon pass={report.structuredData?.pass ?? false} />
            <CardTitle className="text-lg flex items-center gap-2 flex-1">
              <Database className="h-4 w-4 text-muted-foreground" /> Structured Data (JSON-LD / Schema.org)
            </CardTitle>
            <PassBadge pass={report.structuredData?.pass ?? false} partial />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{report.structuredData?.message}</p>
            <CheckRow
              label='<script type="application/ld+json"> block'
              ok={report.structuredData?.hasJsonLd ?? false}
              note="Powers Google Rich Snippets"
            />
            {!report.structuredData?.pass && (
              <div className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                <strong>How to fix:</strong> Add a <code className="bg-muted px-1 rounded">&lt;script type=&quot;application/ld+json&quot;&gt;</code> block to your page with Schema.org markup. Start with <code className="bg-muted px-1 rounded">WebSite</code> or <code className="bg-muted px-1 rounded">Organization</code> schema. In Next.js, add it via a <code className="bg-muted px-1 rounded">&lt;Script&gt;</code> tag in your root layout or as a component. Structured data enables rich results (star ratings, FAQs, breadcrumbs) in Google Search.
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── 10. Link Analysis ────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2 space-y-0">
            <LinkIcon className="h-5 w-5 text-blue-500" />
            <div className="flex-1">
              <CardTitle className="text-lg">Link Structure</CardTitle>
              <CardDescription className="text-sm">Internal vs external link distribution</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted p-4 rounded-lg text-center border">
                <div className="text-2xl font-bold">{report.links.total}</div>
                <div className="text-xs text-muted-foreground uppercase mt-1">Total</div>
              </div>
              <div className="bg-muted p-4 rounded-lg text-center border">
                <div className="text-2xl font-bold text-blue-500">{report.links.internal}</div>
                <div className="text-xs text-muted-foreground uppercase mt-1">Internal</div>
              </div>
              <div className="bg-muted p-4 rounded-lg text-center border">
                <div className="text-2xl font-bold">{report.links.external}</div>
                <div className="text-xs text-muted-foreground uppercase mt-1">External</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{report.links.message}</p>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
