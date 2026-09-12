import { after } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { maxPagesForPlan } from '@/lib/crawl-limits'
import { createRunningScan, processScanTick } from '@/lib/scan-job'
import { ScanError } from '@/lib/scanner'

/** Lifetime scan limit for free-tier users (3 scans total, any domain). */
const FREE_SCAN_LIMIT = 3

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/seo-audit-login', req.url))
    }

    const formData = await req.formData()
    const urlMatch = formData.get('url') as string

    if (!urlMatch) {
      return new NextResponse('URL is required', { status: 400 })
    }

    const domainUrl = urlMatch.startsWith('http')
      ? urlMatch
      : `https://${urlMatch}`

    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email!,
        name: user.user_metadata?.full_name ?? null,
        image: user.user_metadata?.avatar_url ?? null,
      },
      create: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name ?? null,
        image: user.user_metadata?.avatar_url ?? null,
      },
    })

    if (dbUser.subscriptionPlan === 'free') {
      const scanCount = await prisma.domainReport.count({
        where: { userId: user.id },
      })
      if (scanCount >= FREE_SCAN_LIMIT) {
        return NextResponse.redirect(
          new URL('/pricing?limit=reached', req.url),
          { status: 303 }
        )
      }
    }

    const { id } = await createRunningScan({
      userId: user.id,
      domainUrl,
      maxPages: maxPagesForPlan(dbUser.subscriptionPlan),
    })

    after(() => {
      void processScanTick(id)
    })

    return NextResponse.redirect(new URL(`/dashboard/report/${id}`, req.url), {
      status: 303,
    })
  } catch (error) {
    console.error('Scan error:', error)
    if (error instanceof ScanError) {
      return new NextResponse(error.message, { status: 400 })
    }
    return new NextResponse('Failed to scan domain. Please try again later.', {
      status: 500,
    })
  }
}
