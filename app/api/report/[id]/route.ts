import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const reportRecord = await prisma.domainReport.findUnique({
      where: { id: params.id },
    })

    if (!reportRecord || reportRecord.userId !== user.id) {
      return new NextResponse('Not Found', { status: 404 })
    }

    return NextResponse.json(reportRecord)
  } catch (error) {
    console.error('API Report Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
