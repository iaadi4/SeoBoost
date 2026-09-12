import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { canTickReport } from '@/lib/crawl-limits'
import { processScanTick } from '@/lib/scan-job'

export const maxDuration = 60

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as { id?: string } | null
  const id = body?.id
  if (!id) {
    return new NextResponse('Report id is required', { status: 400 })
  }

  const report = await prisma.domainReport.findUnique({ where: { id } })
  if (!report) {
    return new NextResponse('Not Found', { status: 404 })
  }
  if (!canTickReport(report, user.id)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const payload = await processScanTick(id)
  return NextResponse.json(payload)
}
