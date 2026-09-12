import { describe, expect, it } from 'vitest'
import { metadata as dashboard } from '@/app/dashboard/layout'
import { metadata as report } from '@/app/dashboard/report/[id]/layout'
import { metadata as forgot } from '@/app/forgot-password/layout'
import { metadata as reset } from '@/app/reset-password/layout'
import { metadata as login } from '@/app/seo-audit-login/layout'
import { metadata as signup } from '@/app/sign-up/layout'
import { NOINDEX_ROBOTS } from '@/lib/site'

describe('private route metadata', () => {
  it('noindexes the app shell', () => {
    expect(dashboard.robots).toMatchObject(NOINDEX_ROBOTS)
    expect(dashboard.alternates?.canonical).toBe('/dashboard')
    expect(dashboard.alternates?.canonical).not.toBe('/')
  })

  it('noindexes login, signup, and password pages with self canonicals', () => {
    expect(login.robots).toMatchObject(NOINDEX_ROBOTS)
    expect(login.alternates?.canonical).toBe('/seo-audit-login')
    expect(signup.robots).toMatchObject(NOINDEX_ROBOTS)
    expect(signup.alternates?.canonical).toBe('/sign-up')
    expect(forgot.robots).toMatchObject(NOINDEX_ROBOTS)
    expect(reset.robots).toMatchObject(NOINDEX_ROBOTS)
  })

  it('noindexes report URLs instead of inheriting the homepage canonical', () => {
    expect(report.robots).toMatchObject(NOINDEX_ROBOTS)
    expect(report.alternates?.canonical).not.toBe('/')
  })
})
