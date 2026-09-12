import { after } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { maxPagesForPlan } from '@/lib/crawl-limits'
import {
  createRunningScan,
  processScanTick,
  scanApiErrorPayload,
  type ScanApiErrorCode,
} from '@/lib/scan-job'
import { ScanError } from '@/lib/scanner'

/** Lifetime scan limit for free-tier users (3 scans total, any domain). */
const FREE_SCAN_LIMIT = 3

export const maxDuration = 60

function prefersJsonErrors(req: Request): boolean {
  const accept = req.headers.get('accept') ?? ''
  const contentType = req.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) return true
  if (accept.includes('application/json') && !accept.includes('text/html')) {
    return true
  }
  return false
}

function jsonError(
  status: number,
  code: ScanApiErrorCode,
  message?: string
) {
  return NextResponse.json(scanApiErrorPayload(code, message), { status })
}

function isUsableDomainUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return Boolean(parsed.hostname && parsed.hostname.includes('.'))
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      if (prefersJsonErrors(req)) {
        return jsonError(401, 'UNAUTHENTICATED')
      }
      return NextResponse.redirect(new URL('/seo-audit-login', req.url))
    }

    const formData = await req.formData()
    const urlMatch = formData.get('url') as string

    if (!urlMatch) {
      return jsonError(400, 'URL_REQUIRED')
    }

    const domainUrl = urlMatch.startsWith('http')
      ? urlMatch
      : `https://${urlMatch}`

    if (!isUsableDomainUrl(domainUrl)) {
      return jsonError(400, 'DOMAIN_INVALID')
    }

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
        if (prefersJsonErrors(req)) {
          return jsonError(403, 'SCAN_CAP')
        }
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
      const code: ScanApiErrorCode =
        error.code === 'INVALID_URL' ? 'DOMAIN_INVALID' : 'SCAN_FAILED'
      return jsonError(400, code, error.message)
    }
    return jsonError(500, 'SCAN_FAILED')
  }
}
