import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { SCANNER_CHECK_COUNT } from '@/lib/claims'

const chrome = readFileSync(
  path.resolve(process.cwd(), 'components/site-chrome.tsx'),
  'utf8'
)

describe('site chrome copy', () => {
  it('uses Hobby 50 / Pro 500 and the claims check count', () => {
    expect(chrome).toMatch(/50 pages on Hobby or 500 on Pro/)
    expect(chrome).toContain('SCANNER_CHECK_COUNT')
    expect(SCANNER_CHECK_COUNT).toBeGreaterThan(0)
  })

  it('does not keep 45+ leftovers or “best” claims', () => {
    expect(chrome).not.toMatch(/45\+/)
    expect(chrome).not.toMatch(/\bbest\b/i)
  })

  it('keeps seoboost.app only on the support mailbox', () => {
    expect(chrome).toContain('mailto:hello@seoboost.app')
    expect(chrome).not.toMatch(/https:\/\/(www\.)?seoboost\.app/)
  })
})
