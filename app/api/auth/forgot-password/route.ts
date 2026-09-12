import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {
  FORGOT_SUCCESS_MESSAGE,
  getClientIp,
  hitRateLimit,
  normalizeEmail,
  passwordResetRedirectTo,
} from '@/lib/password-reset'

const WINDOW_MS = 15 * 60 * 1000

function genericSuccess() {
  return NextResponse.json({ ok: true, message: FORGOT_SUCCESS_MESSAGE })
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { email?: unknown }
      | null
    const email =
      typeof body?.email === 'string' ? normalizeEmail(body.email) : ''

    if (!email || !email.includes('@')) {
      return genericSuccess()
    }

    const ip = getClientIp(req)
    if (
      hitRateLimit(`forgot:ip:${ip}`, 8, WINDOW_MS) ||
      hitRateLimit(`forgot:email:${email}`, 3, WINDOW_MS)
    ) {
      return genericSuccess()
    }

    const supabase = await createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: passwordResetRedirectTo(),
    })
    return genericSuccess()
  } catch {
    console.error('forgot-password failed')
    return genericSuccess()
  }
}
