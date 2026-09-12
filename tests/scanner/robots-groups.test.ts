import { describe, expect, it } from 'vitest'
import { evaluateRobotsTxt, parseRobotsGroups } from '@/lib/ai-search'

describe('parseRobotsGroups', () => {
  it('shares Allow/Disallow across consecutive User-agent lines', () => {
    const groups = parseRobotsGroups(`
# comment
User-agent: Googlebot
User-agent: Bingbot
Disallow: /private
Allow: /public

User-agent: *
Allow: /
`)
    expect(groups.get('googlebot')?.disallow).toEqual(['/private'])
    expect(groups.get('bingbot')?.disallow).toEqual(['/private'])
    expect(groups.get('googlebot')?.allow).toEqual(['/public'])
    expect(groups.get('*')?.allow).toEqual(['/'])
  })

  it('ignores blank and comment-only files', () => {
    expect(parseRobotsGroups('# only\n\n').size).toBe(0)
  })
})

describe('evaluateRobotsTxt format', () => {
  it('warns when User-agent is missing', () => {
    const { check } = evaluateRobotsTxt('Disallow: /admin\n')
    expect(check.id).toBe('robots-txt')
    expect(check.status).toBe('warning')
    expect(check.value).toMatch(/Invalid format/i)
  })

  it('is good when valid and sitemap is referenced', () => {
    const { check, aiBotsCheck } = evaluateRobotsTxt(
      'User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml\n'
    )
    expect(check.status).toBe('good')
    expect(aiBotsCheck.id).toBe('ai-bots-robots')
    expect(aiBotsCheck.status).toBe('good')
    expect(aiBotsCheck.whyItMatters).toMatch(/not a GEO score/i)
  })
})
