import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { ReportsClient } from './reports-client'
import { toReportListItem } from '../report-list-data'

export default async function ReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/seo-audit-login')
  }

  const [dbUser, allReports] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { subscriptionPlan: true },
    }),
    prisma.domainReport.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const complete = allReports.filter((r) => r.status === 'complete')
  const avgScore = complete.length
    ? Math.round(complete.reduce((sum, r) => sum + r.score, 0) / complete.length)
    : null

  return (
    <ReportsClient
      reports={allReports.map(toReportListItem)}
      totalScans={allReports.length}
      avgScore={avgScore}
      subscriptionPlan={dbUser?.subscriptionPlan || 'free'}
    />
  )
}
