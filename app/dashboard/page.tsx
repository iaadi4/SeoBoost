import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { ScanForm } from './scan-form'
import { DashboardClient } from './dashboard-client'
import { dodopayments } from '@/lib/dodopayments'
import { toReportListItem } from './report-list-data'

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/seo-audit-login')
  }

  let dbUser = await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name ?? null,
      image: user.user_metadata?.avatar_url ?? null,
    },
  })

  // Synchronous webhoook verification fallback for immediate UI state hydration
  if (
    searchParams?.payment_id &&
    searchParams?.status === 'succeeded' &&
    dbUser.subscriptionPlan !== 'pro'
  ) {
    try {
      const paymentInfo = await dodopayments.payments.retrieve(
        searchParams.payment_id as string
      )
      if (paymentInfo.status === 'succeeded') {
        dbUser = await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionPlan: 'pro' },
        })
      }
    } catch (error) {
      console.error('Failed to verify payment synchronously:', error)
    }
  }

  const [totalScans, completeStats, recentReports] = await Promise.all([
    prisma.domainReport.count({
      where: { userId: user.id },
    }),
    prisma.domainReport.aggregate({
      where: { userId: user.id, status: 'complete' },
      _avg: { score: true },
    }),
    prisma.domainReport.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
  ])

  const rawAvg = completeStats._avg.score
  const avgScore = rawAvg == null ? null : Math.round(Number(rawAvg))

  const userName =
    user.user_metadata?.full_name?.split(' ')[0] ||
    user.email?.split('@')[0] ||
    'there'

  return (
    <DashboardClient
      userName={userName}
      subscriptionPlan={dbUser.subscriptionPlan}
      totalScans={totalScans}
      avgScore={avgScore}
      recentReports={recentReports.map(toReportListItem)}
    >
      <ScanForm />
    </DashboardClient>
  )
}
