import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { SEOReport } from '@/lib/scanner'
import { isRunningPayload, parseStoredScan } from '@/lib/scan-job'
import { CompletedReport } from './completed-report'
import { ReportFrame } from './report-frame'
import { ReportFailed, ReportLegacy, ReportUnreadable } from './report-states'
import { ScanProgress } from './scan-progress'

export default async function ReportPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/seo-audit-login')
  }

  const reportRecord = await prisma.domainReport.findUnique({
    where: { id: id },
  })

  if (!reportRecord || reportRecord.userId !== user.id) {
    redirect('/dashboard')
  }

  const stored = parseStoredScan(reportRecord.reportData)

  if (reportRecord.status === 'running' && isRunningPayload(stored)) {
    return (
      <ReportFrame>
        <ScanProgress
          reportId={reportRecord.id}
          domainUrl={reportRecord.domainUrl}
          initial={stored}
        />
      </ReportFrame>
    )
  }

  if (reportRecord.status === 'failed' || stored?.status === 'failed') {
    const message =
      stored && stored.status === 'failed' ? stored.error : 'The scan failed.'
    return <ReportFailed domainUrl={reportRecord.domainUrl} message={message} />
  }

  let report: SEOReport
  try {
    report = (stored?.status === 'complete'
      ? stored
      : JSON.parse(reportRecord.reportData)) as SEOReport
  } catch {
    return <ReportUnreadable />
  }

  if (!report.aggregatedChecks) {
    return <ReportLegacy />
  }

  return (
    <CompletedReport
      report={report}
      domainUrl={reportRecord.domainUrl}
      scannedAt={reportRecord.createdAt.toISOString()}
    />
  )
}
