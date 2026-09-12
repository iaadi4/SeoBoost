import { describe, expect, it } from 'vitest'
import {
  evaluateAiSnippetEligible,
  evaluateExtractableText,
  evaluateLlmsTxt,
  evaluateRobotsTxt,
} from '@/lib/ai-search'

describe('evaluateAiSnippetEligible', () => {
  it('names nosnippet evidence and does not call it a ranking penalty', () => {
    const result = evaluateAiSnippetEligible({
      robotsMeta: 'nosnippet',
      xRobotsHeader: '',
      googleBotMeta: '',
      bingBotMeta: '',
      dataNosnippetOnMain: false,
    })
    expect(result.status).toBe('warning')
    expect(result.value).toBe('nosnippet')
    expect(result.message).toMatch(/AI Overviews \/ AI Mode as a direct input/i)
    expect(result.howToFix).toMatch(/Evidence: meta robots: nosnippet/)
    expect(result.whyItMatters).toMatch(/not a ranking penalty and not a GEO score/i)
    expect(`${result.message} ${result.howToFix}`).toMatch(
      /Do not treat this as a ranking penalty or a citation percentage/
    )
  })

  it('treats max-snippet:0 like nosnippet and records the directive', () => {
    const result = evaluateAiSnippetEligible({
      robotsMeta: 'max-snippet:0',
      xRobotsHeader: '',
      googleBotMeta: '',
      bingBotMeta: '',
      dataNosnippetOnMain: false,
    })
    expect(result.status).toBe('warning')
    expect(result.value).toBe('max-snippet:0')
    expect(result.howToFix).toMatch(/max-snippet:0/)
  })

  it('flags data-nosnippet on main separately from meta robots', () => {
    const result = evaluateAiSnippetEligible({
      robotsMeta: '',
      xRobotsHeader: '',
      googleBotMeta: '',
      bingBotMeta: '',
      dataNosnippetOnMain: true,
    })
    expect(result.status).toBe('warning')
    expect(result.value).toMatch(/data-nosnippet/)
    expect(result.howToFix).toMatch(/data-nosnippet/)
  })

  it('keeps noarchive as Bing-only; Google ignores it', () => {
    const result = evaluateAiSnippetEligible({
      robotsMeta: 'noarchive',
      xRobotsHeader: '',
      googleBotMeta: '',
      bingBotMeta: '',
      dataNosnippetOnMain: false,
    })
    expect(result.status).toBe('warning')
    expect(result.message).toMatch(/Bing Chat \/ Copilot/)
    expect(result.message).toMatch(/Google ignores noarchive/)
    expect(result.howToFix).not.toMatch(/Disallow Googlebot to opt out of AI/)
  })

  it('passes when snippet controls are absent', () => {
    const result = evaluateAiSnippetEligible({
      robotsMeta: 'index, follow, max-snippet:-1',
      xRobotsHeader: '',
      googleBotMeta: '',
      bingBotMeta: '',
      dataNosnippetOnMain: false,
    })
    expect(result.status).toBe('good')
    expect(result.howToFix).toMatch(/not a citation percentage/i)
  })
})

describe('evaluateExtractableText', () => {
  it('warns on a CSR shell with first-HTML evidence', () => {
    const result = evaluateExtractableText({
      wordCount: 3,
      mainTextLength: 0,
      looksLikeCsr: true,
    })
    expect(result.status).toBe('warning')
    expect(result.message).toMatch(/static HTML only/i)
    expect(result.howToFix).toMatch(/#root\/#app/)
    expect(result.howToFix).toMatch(/first HTML/)
    expect(result.whyItMatters).toMatch(
      /not a GEO score or a citation percentage/
    )
    expect(result.howToFix).toMatch(/Do not pad word count as a ranking fix/)
  })

  it('passes when first HTML has extractable main text', () => {
    const result = evaluateExtractableText({
      wordCount: 120,
      mainTextLength: 400,
      looksLikeCsr: false,
    })
    expect(result.status).toBe('good')
    expect(result.message).toMatch(/First HTML has extractable main text/)
    expect(result.howToFix).toMatch(/not treat extractable text as a citation percentage/)
  })
})

describe('training vs search bots', () => {
  it('OAI-SearchBot Disallow warns ChatGPT Search, not training', () => {
    const { aiBotsCheck } = evaluateRobotsTxt(
      'User-agent: OAI-SearchBot\nDisallow: /\n\nUser-agent: *\nAllow: /\n'
    )
    expect(aiBotsCheck.status).toBe('warning')
    expect(aiBotsCheck.message).toMatch(/ChatGPT Search/)
    expect(aiBotsCheck.snippet).toMatch(/OAI-SearchBot/)
    expect(aiBotsCheck.howToFix).toMatch(/Never Disallow Googlebot/)
    expect(aiBotsCheck.howToFix).not.toMatch(/Disallow Googlebot to opt out of AI/)
  })

  it('GPTBot-only Disallow is training, not ChatGPT Search', () => {
    const { aiBotsCheck } = evaluateRobotsTxt(
      'User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /\n'
    )
    expect(aiBotsCheck.status).toBe('good')
    expect(aiBotsCheck.message).toMatch(/training opt-out/i)
    expect(aiBotsCheck.message).toMatch(/OAI-SearchBot/)
    expect(aiBotsCheck.snippet).toMatch(/GPTBot/)
  })

  it('Googlebot Disallow is critical Search loss, not an AI-training switch', () => {
    const { aiBotsCheck } = evaluateRobotsTxt(
      'User-agent: Googlebot\nDisallow: /\n\nUser-agent: *\nAllow: /\n'
    )
    expect(aiBotsCheck.status).toBe('critical')
    expect(aiBotsCheck.value).toMatch(/Googlebot blocked/)
    expect(aiBotsCheck.howToFix).toMatch(/Search opt-out, not an AI-training switch/)
    expect(aiBotsCheck.whyItMatters).not.toMatch(/GEO score(?! and)/)
    expect(aiBotsCheck.whyItMatters).toMatch(/not a GEO score/)
  })
})

describe('llms.txt is never a fail', () => {
  it('missing file stays good', () => {
    const result = evaluateLlmsTxt(false)
    expect(result.status).toBe('good')
    expect(result.message).toMatch(/not a fail/i)
    expect(result.howToFix).toMatch(/Do not add llms\.txt to chase/)
  })

  it('present file stays good and is not a ranking pass', () => {
    const result = evaluateLlmsTxt(true)
    expect(result.status).toBe('good')
    expect(result.status).not.toBe('warning')
    expect(result.status).not.toBe('critical')
    expect(result.message).toMatch(/not a ranking pass/i)
  })
})
