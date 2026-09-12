import { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { maxPagesForPlan } from '@/lib/crawl-limits'
import { NOINDEX_ROBOTS } from '@/lib/site'
import { FREE_SCAN_LIMIT } from '../report-list-data'
import { AccountSettings } from './account-settings'

export const metadata: Metadata = {
  title: 'Account',
  robots: NOINDEX_ROBOTS,
}

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/seo-audit-login')
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

  const isPro = dbUser.subscriptionPlan === 'pro'
  const planLabel = isPro ? 'Pro' : 'Hobby'

  return (
    <AccountSettings
      email={user.email ?? dbUser.email}
      name={
        dbUser.name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        ''
      }
      planLabel={planLabel}
      isPro={isPro}
      pageCap={maxPagesForPlan(dbUser.subscriptionPlan)}
      totalScans={totalScans}
      scansRemaining={
        isPro ? null : Math.max(0, FREE_SCAN_LIMIT - totalScans)
      }
      memberSince={dbUser.createdAt.toISOString()}
    />
  )
}
