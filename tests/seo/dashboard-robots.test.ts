import { describe, expect, it } from 'vitest'
import { metadata } from '@/app/dashboard/layout'

describe('dashboard metadata', () => {
  it('noindexes the app shell', () => {
    expect(metadata.robots).toMatchObject({ index: false, follow: false })
    expect(metadata.alternates?.canonical).toBe('/dashboard')
  })
})
