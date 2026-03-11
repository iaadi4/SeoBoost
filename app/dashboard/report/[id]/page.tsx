import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  CheckCircle2,
  Link as LinkIcon,
  AlertCircle,
  Type,
  ImageIcon,
  FileText,
  Code,
} from 'lucide-react'
import Link from 'next/link'
import { SEOReport } from '@/lib/scanner'

export default async function ReportPage(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const reportRecord = await prisma.domainReport.findUnique({
    where: { id: params.id },
  })

  if (!reportRecord || reportRecord.userId !== user.id) {
    redirect('/dashboard')
  }

  const report: SEOReport = JSON.parse(reportRecord.reportData)
  const domainHost = new URL(reportRecord.domainUrl).hostname

  return (
    <div className="container mx-auto px-4 sm:px-8 py-10 max-w-4xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            SEO Report: {domainHost}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Scanned on {new Date(reportRecord.createdAt).toLocaleString()}
            <a
              href={reportRecord.domainUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline ml-2 text-sm inline-flex items-center"
            >
              Visit <LinkIcon className="ml-1 h-3 w-3" />
            </a>
          </p>
        </div>

        <Card
          className={`shrink-0 border-2 w-full md:w-auto text-center ${
            report.score >= 80
              ? 'border-green-500/50 bg-green-500/5'
              : report.score >= 50
                ? 'border-yellow-500/50 bg-yellow-500/5'
                : 'border-red-500/50 bg-red-500/5'
          }`}
        >
          <CardContent className="pt-6 px-10 pb-6">
            <div className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">
              Health Score
            </div>
            <div
              className={`text-6xl font-extrabold ${
                report.score >= 80
                  ? 'text-green-500'
                  : report.score >= 50
                    ? 'text-yellow-500'
                    : 'text-red-500'
              }`}
            >
              {report.score}
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-6">Detailed Analysis</h2>

      <div className="grid gap-6">
        {/* Title Tag */}
        <Card
          className={
            report.title.pass ? 'border-green-500/20' : 'border-red-500/20'
          }
        >
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div
              className={`p-2 rounded-full ${report.title.pass ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
            >
              {report.title.pass ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Type className="h-5 w-5 text-muted-foreground" /> Title Tag
              </CardTitle>
            </div>
            <Badge
              variant={report.title.pass ? 'default' : 'destructive'}
              className={
                report.title.pass ? 'bg-green-500 hover:bg-green-600' : ''
              }
            >
              {report.title.pass ? 'Passed' : 'Needs Fix'}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{report.title.message}</p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm break-all border">
              {report.title.value || (
                <span className="text-muted-foreground italic">
                  No title found
                </span>
              )}
            </div>
            <div className="mt-3 text-sm flex justify-between items-center text-muted-foreground">
              <span>Length: {report.title.value.length} chars</span>
              <span>Target: 30-65 chars</span>
            </div>
            <Progress
              value={Math.min(100, (report.title.value.length / 65) * 100)}
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        {/* Meta Description */}
        <Card
          className={
            report.description.pass
              ? 'border-green-500/20'
              : 'border-red-500/20'
          }
        >
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div
              className={`p-2 rounded-full ${report.description.pass ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
            >
              {report.description.pass ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" /> Meta
                Description
              </CardTitle>
            </div>
            <Badge
              variant={report.description.pass ? 'default' : 'destructive'}
              className={
                report.description.pass ? 'bg-green-500 hover:bg-green-600' : ''
              }
            >
              {report.description.pass ? 'Passed' : 'Needs Fix'}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {report.description.message}
            </p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm break-all border">
              {report.description.value || (
                <span className="text-muted-foreground italic">
                  No meta description found
                </span>
              )}
            </div>
            <div className="mt-3 text-sm flex justify-between items-center text-muted-foreground">
              <span>Length: {report.description.value.length} chars</span>
              <span>Target: 70-160 chars</span>
            </div>
            <Progress
              value={Math.min(
                100,
                (report.description.value.length / 160) * 100
              )}
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        {/* H1 Tags */}
        <Card
          className={
            report.h1.pass ? 'border-green-500/20' : 'border-red-500/20'
          }
        >
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div
              className={`p-2 rounded-full ${report.h1.pass ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
            >
              {report.h1.pass ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded text-sm">
                  &lt;h1&gt;
                </span>{' '}
                Heading Structure
              </CardTitle>
            </div>
            <Badge
              variant={report.h1.pass ? 'default' : 'destructive'}
              className={
                report.h1.pass ? 'bg-green-500 hover:bg-green-600' : ''
              }
            >
              {report.h1.pass ? 'Passed' : 'Needs Fix'}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{report.h1.message}</p>
            {report.h1.value && (
              <div className="bg-muted p-4 rounded-lg font-mono text-sm break-all border">
                {report.h1.value}
              </div>
            )}
            <div className="mt-3 text-sm text-muted-foreground">
              Found <strong>{report.h1.count}</strong> H1 tags on the page.
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card
          className={
            report.images.pass ? 'border-green-500/20' : 'border-red-500/20'
          }
        >
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div
              className={`p-2 rounded-full ${report.images.pass ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
            >
              {report.images.pass ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-muted-foreground" /> Image
                Optimization
              </CardTitle>
            </div>
            <Badge
              variant={report.images.pass ? 'default' : 'destructive'}
              className={
                report.images.pass ? 'bg-green-500 hover:bg-green-600' : ''
              }
            >
              {report.images.pass ? 'Passed' : 'Needs Fix'}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {report.images.message}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div className="bg-muted p-4 rounded-lg text-center border">
                <div className="text-2xl font-bold">{report.images.total}</div>
                <div className="text-xs text-muted-foreground uppercase mt-1">
                  Total Images
                </div>
              </div>
              <div className="bg-muted p-4 rounded-lg text-center border">
                <div className="text-2xl font-bold text-red-500">
                  {report.images.missingAlt}
                </div>
                <div className="text-xs text-muted-foreground uppercase mt-1">
                  Missing Alt
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Links Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
              <LinkIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Linking Structure</CardTitle>
              <CardDescription>Pages discovered on this URL</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted p-4 rounded-lg text-center border">
                <div className="text-2xl font-bold">{report.links.total}</div>
                <div className="text-xs text-muted-foreground uppercase mt-1">
                  Total Links
                </div>
              </div>
              <div className="bg-muted p-4 rounded-lg text-center border">
                <div className="text-2xl font-bold">
                  {report.links.internal}
                </div>
                <div className="text-xs text-muted-foreground uppercase mt-1">
                  Internal
                </div>
              </div>
              <div className="bg-muted p-4 rounded-lg text-center border">
                <div className="text-2xl font-bold">
                  {report.links.external}
                </div>
                <div className="text-xs text-muted-foreground uppercase mt-1">
                  External
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Analysis */}
        <Card
          className={
            report.content?.pass ? 'border-green-500/20' : 'border-red-500/20'
          }
        >
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div
              className={`p-2 rounded-full ${report.content?.pass ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
            >
              {report.content?.pass ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" /> Content
                Volume
              </CardTitle>
            </div>
            <Badge
              variant={report.content?.pass ? 'default' : 'destructive'}
              className={
                report.content?.pass ? 'bg-green-500 hover:bg-green-600' : ''
              }
            >
              {report.content?.pass ? 'Passed' : 'Needs Fix'}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {report.content?.message ||
                'Verify sufficient content exists to rank.'}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-muted p-4 rounded-lg border flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">
                  {report.content?.wordCount || 0}
                </span>
                <span className="text-xs text-muted-foreground uppercase mt-1">
                  Words Detected
                </span>
              </div>
            </div>
            <Progress
              value={Math.min(
                100,
                ((report.content?.wordCount || 0) / 500) * 100
              )}
              className="h-2 mt-4"
            />
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Target: 300+ words
            </div>
          </CardContent>
        </Card>

        {/* Technical SEO */}
        <Card
          className={
            report.technical?.pass ? 'border-green-500/20' : 'border-red-500/20'
          }
        >
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div
              className={`p-2 rounded-full ${report.technical?.pass ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
            >
              {report.technical?.pass ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Code className="h-5 w-5 text-muted-foreground" /> Technical &
                Core Tags
              </CardTitle>
            </div>
            <Badge
              variant={report.technical?.pass ? 'default' : 'destructive'}
              className={
                report.technical?.pass ? 'bg-green-500 hover:bg-green-600' : ''
              }
            >
              {report.technical?.pass ? 'Passed' : 'Needs Fix'}
            </Badge>
          </CardHeader>
          <CardContent>
            {!report.technical?.isIndexable && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-4 text-sm font-medium">
                CRITICAL: Search engines are blocked from indexing this page via
                a noindex tag!
              </div>
            )}
            <p className="text-muted-foreground mb-4">
              {report.technical?.message ||
                'Checking core rendering and accessibility meta tags.'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div
                className={`p-4 rounded-lg text-center border ${report.technical?.hasViewport ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}
              >
                <div className="text-sm font-medium">Viewport</div>
                <div
                  className={`text-xs mt-1 ${report.technical?.hasViewport ? 'text-green-500' : 'text-red-500'}`}
                >
                  {report.technical?.hasViewport ? 'Valid' : 'Missing'}
                </div>
              </div>
              <div
                className={`p-4 rounded-lg text-center border ${report.technical?.isIndexable ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}
              >
                <div className="text-sm font-medium">Robots</div>
                <div
                  className={`text-xs mt-1 ${report.technical?.isIndexable ? 'text-green-500' : 'text-red-500'}`}
                >
                  {report.technical?.isIndexable ? 'Indexable' : 'noindex'}
                </div>
              </div>
              <div
                className={`p-4 rounded-lg text-center border ${report.technical?.hasFavicon ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}
              >
                <div className="text-sm font-medium">Favicon</div>
                <div
                  className={`text-xs mt-1 ${report.technical?.hasFavicon ? 'text-green-500' : 'text-yellow-600'}`}
                >
                  {report.technical?.hasFavicon ? 'Found' : 'Missing'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
