import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SITE_ORIGIN } from '@/lib/site'
import {
  FORGOT_SUCCESS_MESSAGE,
  hitRateLimit,
  inspectPasswordRecoveryUrl,
  normalizeEmail,
  passwordResetRedirectTo,
  resetRateLimitsForTests,
} from '@/lib/password-reset'

const resetPasswordForEmail = vi.fn()

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { resetPasswordForEmail },
  })),
}))

describe('password reset helpers', () => {
  afterEach(() => {
    resetRateLimitsForTests()
  })

  it('points recovery redirects at the public boost-seo origin', () => {
    const url = passwordResetRedirectTo()
    expect(url).toBe(`${SITE_ORIGIN}/reset-password`)
    expect(url).toContain('https://boost-seo.vercel.app')
    expect(url).not.toContain('seoboost.app')
    expect(url).not.toContain('token=')
  })

  it('detects recovery codes, hashes, otp links, and errors', () => {
    expect(
      inspectPasswordRecoveryUrl(
        'https://boost-seo.vercel.app/reset-password?code=abc'
      )
    ).toEqual({ kind: 'pkce', code: 'abc' })
    expect(
      inspectPasswordRecoveryUrl(
        'https://boost-seo.vercel.app/reset-password?token_hash=xyz&type=recovery'
      )
    ).toEqual({ kind: 'otp', tokenHash: 'xyz' })
    expect(
      inspectPasswordRecoveryUrl(
        'https://boost-seo.vercel.app/reset-password#access_token=tok&type=recovery'
      )
    ).toEqual({ kind: 'hash' })
    expect(
      inspectPasswordRecoveryUrl(
        'https://boost-seo.vercel.app/reset-password?error=access_denied&error_description=expired'
      )
    ).toEqual({ kind: 'error', message: 'expired' })
    expect(
      inspectPasswordRecoveryUrl('https://boost-seo.vercel.app/reset-password')
    ).toEqual({ kind: 'none' })
  })

  it('rate-limits after the allowed hits in a window', () => {
    expect(hitRateLimit('t', 2, 60_000)).toBe(false)
    expect(hitRateLimit('t', 2, 60_000)).toBe(false)
    expect(hitRateLimit('t', 2, 60_000)).toBe(true)
  })

  it('keeps the forgot-password reply generic', () => {
    expect(normalizeEmail('  Ada@Example.COM ')).toBe('ada@example.com')
    expect(FORGOT_SUCCESS_MESSAGE.toLowerCase()).toContain('if an account exists')
  })
})

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    resetRateLimitsForTests()
    resetPasswordForEmail.mockReset()
    resetPasswordForEmail.mockResolvedValue({ data: {}, error: null })
  })

  it('calls resetPasswordForEmail with the public reset URL and stays generic', async () => {
    const { POST } = await import('@/app/api/auth/forgot-password/route')
    const res = await POST(
      new Request('http://localhost/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: ' Ada@Example.COM ' }),
      })
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ ok: true, message: FORGOT_SUCCESS_MESSAGE })
    expect(resetPasswordForEmail).toHaveBeenCalledTimes(1)
    expect(resetPasswordForEmail).toHaveBeenCalledWith('ada@example.com', {
      redirectTo: `${SITE_ORIGIN}/reset-password`,
    })
  })

  it('does not reveal unknown or invalid emails', async () => {
    const { POST } = await import('@/app/api/auth/forgot-password/route')

    const invalid = await POST(
      new Request('http://localhost/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      })
    )
    const missing = await POST(
      new Request('http://localhost/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
    )

    expect(await invalid.json()).toEqual({
      ok: true,
      message: FORGOT_SUCCESS_MESSAGE,
    })
    expect(await missing.json()).toEqual({
      ok: true,
      message: FORGOT_SUCCESS_MESSAGE,
    })
    expect(resetPasswordForEmail).not.toHaveBeenCalled()
  })
})
