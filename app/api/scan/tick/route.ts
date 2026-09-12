import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { canTickReport } from '@/lib/crawl-limits'
import { processScanTick, scanApiErrorPayload } from '@/lib/scan-job'

export const maxDuration = 60

function jsonError(
  status: number,
  code: Parameters<typeof scanApiErrorPayload>[0],
  message?: string
) {
  return NextResponse.json(scanApiErrorPayload(code, message), { status })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return jsonError(401, 'UNAUTHENTICATED')
  }

  const body = (await req.json().catch(() => null)) as { id?: string } | null
  const id = body?.id
  if (!id) {
    return jsonError(400, 'REPORT_ID_REQUIRED')
  }

  const report = await prisma.domainReport.findUnique({ where: { id } })
  if (!report) {
    return jsonError(404, 'NOT_FOUND')
  }
  if (!canTickReport(report, user.id)) {
    return jsonError(403, 'FORBIDDEN')
  }

  try {
    const payload = await processScanTick(id)
    return NextResponse.json(payload)
  } catch (error) {
    console.error('Scan tick error:', error)
    return jsonError(
      500,
      'SCAN_FAILED',
      error instanceof Error ? error.message : undefined
    )
  }
}
