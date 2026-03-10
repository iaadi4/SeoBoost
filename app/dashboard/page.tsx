import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { ScanForm } from './scan-form'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const dbUser = await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name ?? null,
      image: user.user_metadata?.avatar_url ?? null,
    },
  })

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
        recentReports.reduce((a, b) => a + b.score, 0) / recentReports.length
      )
    : 0

  const userName =
    user.user_metadata?.full_name?.split(' ')[0] ||
    user.email?.split('@')[0] ||
    'there'

  const reportsForClient = recentReports.map((r) => ({
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
