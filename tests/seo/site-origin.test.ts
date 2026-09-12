import { describe, expect, it } from 'vitest'
import { SITE_ORIGIN } from '@/lib/site'

describe('SITE_ORIGIN', () => {
  it('never treats seoboost.app as the public site origin', () => {
    expect(SITE_ORIGIN).not.toMatch(/seoboost\.app/)
    expect(SITE_ORIGIN).toBe(
      (process.env.NEXT_PUBLIC_APP_URL ?? 'https://boost-seo.vercel.app').replace(
        /\/$/,
        ''
      )
    )
  })
})
