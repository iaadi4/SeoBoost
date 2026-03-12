import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { ReportsClient } from './reports-client'

export default async function ReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/seo-audit-login')
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { subscriptionPlan: true },
  })

  const allReports = await prisma.domainReport.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  const totalScans = allReports.length
  const avgScore = totalScans
    ? Math.round(
        allReports.reduce((a, b) => a + b.score, 0) / totalScans
      )
    : 0

  const reportsForClient = allReports.map((r) => ({
    id: r.id,
    domainUrl: r.domainUrl,
    score: r.score,
    createdAt: r.createdAt.toISOString(),
  }))

  return (
    <ReportsClient
      reports={reportsForClient}
      totalScans={totalScans}
      avgScore={avgScore}
      subscriptionPlan={dbUser?.subscriptionPlan || 'free'}
    />
  )
}
