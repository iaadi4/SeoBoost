import { FORGOT_SUCCESS_MESSAGE } from '@/lib/auth-ui'
import { SITE_ORIGIN } from '@/lib/site'

export { FORGOT_SUCCESS_MESSAGE }

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function passwordResetRedirectTo(origin = SITE_ORIGIN) {
  return `${origin.replace(/\/$/, '')}/reset-password`
}

export type RecoveryUrlHint =
  | { kind: 'none' }
  | { kind: 'error'; message?: string }
  | { kind: 'pkce'; code: string }
  | { kind: 'otp'; tokenHash: string }
  | { kind: 'hash' }

export function inspectPasswordRecoveryUrl(href: string): RecoveryUrlHint {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return { kind: 'none' }
  }

  const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
  const query = url.searchParams

  const error = query.get('error') || hash.get('error')
  if (error) {
    return {
      kind: 'error',
      message:
        query.get('error_description') ||
        hash.get('error_description') ||
        undefined,
    }
  }

  const code = query.get('code')
  if (code) return { kind: 'pkce', code }

  const tokenHash = query.get('token_hash')
  const type = query.get('type') || hash.get('type')
  if (tokenHash && (type === 'recovery' || !type)) {
    return { kind: 'otp', tokenHash }
  }

  if (type === 'recovery' || hash.get('access_token')) {
    return { kind: 'hash' }
  }

  return { kind: 'none' }
}

export function getClientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

type Bucket = { count: number; resetAt: number }

const rateBuckets = new Map<string, Bucket>()

export function hitRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const existing = rateBuckets.get(key)
  if (!existing || existing.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  existing.count += 1
  return existing.count > limit
}

export function resetRateLimitsForTests() {
  rateBuckets.clear()
}
