import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CHECK_IDS, SCANNER_CHECK_COUNT } from '@/lib/claims'
import { CROSS_PAGE_CHECK_IDS } from '@/lib/cross-page'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

const SOURCE_FILES = [
  'lib/scanner.ts',
  'lib/ai-search.ts',
  'lib/cross-page.ts',
  'lib/fetch-page.ts',
]

function idsFromSource(relative: string): string[] {
  const src = readFileSync(join(root, relative), 'utf8')
  const fromCheck = [...src.matchAll(/check(?:Fn)?\(\s*'([a-z0-9-]+)'/g)].map(
    (m) => m[1]
  )
  const fromIdProp = [...src.matchAll(/\bid:\s*'([a-z0-9-]+)'/g)].map((m) => m[1])
  return [...fromCheck, ...fromIdProp]
}

describe('scanner check inventory', () => {
  it('CHECK_IDS matches unique IDs emitted by scanner helpers', () => {
    const emitted = new Set<string>([
      ...SOURCE_FILES.flatMap(idsFromSource),
      ...Object.values(CROSS_PAGE_CHECK_IDS),
    ])
    expect([...emitted].sort()).toEqual([...CHECK_IDS])
    expect(SCANNER_CHECK_COUNT).toBe(emitted.size)
    expect(SCANNER_CHECK_COUNT).toBeGreaterThanOrEqual(45)
  })
})
