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

  const allReports = await prisma.domainReport.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  const reportsForClient = allReports.map((r: (typeof allReports)[number]) => ({
    id: r.id,
    domainUrl: r.domainUrl,
    score: r.score,
    createdAt: r.createdAt.toISOString(),
  }))

  return <ReportsClient reports={reportsForClient} />
}
