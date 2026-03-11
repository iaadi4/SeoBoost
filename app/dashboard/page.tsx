import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { ScanForm } from './scan-form'
import { DashboardClient } from './dashboard-client'
import { dodopayments } from '@/lib/dodopayments'

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
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
      const paymentInfo = await dodopayments.payments.retrieve(searchParams.payment_id as string)
      if (paymentInfo.status === 'succeeded') {
        dbUser = await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionPlan: 'pro' }
        })
      }
    } catch (error) {
      console.error('Failed to verify payment synchronously:', error)
    }
  }

  const totalScans = await prisma.domainReport.count({
    where: { userId: user.id },
  })

  const recentReports = await prisma.domainReport.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  const avgScore = recentReports.length
    ? Math.round(
        recentReports.reduce((a: number, b: { score: number }) => a + b.score, 0) /
          recentReports.length
      )
    : 0

  const userName =
    user.user_metadata?.full_name?.split(' ')[0] ||
    user.email?.split('@')[0] ||
    'there'

  const reportsForClient = recentReports.map((r: (typeof recentReports)[number]) => ({
    id: r.id,
    domainUrl: r.domainUrl,
    score: r.score,
    createdAt: r.createdAt.toISOString(),
  }))

  return (
    <DashboardClient
      userName={userName}
      subscriptionPlan={dbUser.subscriptionPlan}
      totalScans={totalScans}
      avgScore={avgScore}
      recentReports={reportsForClient}
    >
      <ScanForm />
    </DashboardClient>
  )
}
