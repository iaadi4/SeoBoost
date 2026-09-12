export type Measurement = 'html' | 'crux' | 'psi' | 'none'

export type FeatureKind = 'audit' | 'product'

/**
 * Unique check IDs the scanner can emit (page + domain).
 * Other lanes should import this list instead of inventing counts.
 */
export const CHECK_IDS = [
  'aggregate-rating',
  'ai-bots-robots',
  'ai-extractable-text',
  'ai-snippet-eligible',
  'anchor-text',
  'aria',
  'breadcrumb-schema',
  'caching',
  'canonical',
  'canonical-conflicts',
  'canonical-gaps',
  'charset',
  'compression',
  'description',
  'doctype',
  'duplicate-descriptions',
  'duplicate-h1',
  'duplicate-titles',
  'external-link-security',
  'faq-schema',
  'favicon',
  'fetch-error',
  'form-labels',
  'h1',
  'heading-hierarchy',
  'hreflang',
  'hsts',
  'html-lang',
  'http-status',
  'img-alt',
  'internal-links',
  'keyword-in-intro',
  'lazy-loading',
  'llms-txt',
  'meta-robots',
  'og-tags',
  'page-size',
  'placeholder-links',
  'readability',
  'redirect-chain',
  'render-blocking',
  'resource-hints',
  'robots-txt',
  'schema',
  'security-headers',
  'semantic-html',
  'sitemap',
  'skip-nav',
  'soft-404',
  'ssl',
  'title',
  'twitter-cards',
  'url-keywords',
  'url-structure',
  'video-schema',
  'viewport',
  'word-count',
] as const

export type CheckId = (typeof CHECK_IDS)[number]

export const CHECK_CATEGORIES = [
  'meta',
  'content',
  'technical',
  'performance',
  'social',
  'accessibility',
  'security',
  'links',
  'images',
  'structured-data',
  'ai-search',
  'domain',
] as const

export type ClaimCheckCategory = (typeof CHECK_CATEGORIES)[number]

/** Unique check IDs that can fire on a real scan (page + domain). */
export const SCANNER_CHECK_COUNT = CHECK_IDS.length
export const SCANNER_CATEGORY_COUNT = CHECK_CATEGORIES.length

export interface FeatureClaim {
  userLabel: string
  free: boolean | string
  pro: boolean | string
  kind: FeatureKind
  checkIds: CheckId[]
  measurement: Measurement
}

/**
 * Single Hobby/Pro matrix. Audit rows must map to real scanner check ids.
 * Do not add CWV, GEO, link-graph, or AI Overview rows until those lanes exist.
 */
export const FEATURE_CLAIMS: FeatureClaim[] = [
  {
    userLabel: 'Scans (total / monthly)',
    free: '3 lifetime',
    pro: 'Unlimited',
    kind: 'product',
    checkIds: [],
    measurement: 'html',
  },
  {
    userLabel: 'Pages crawled per scan',
    free: '50',
    pro: '500',
    kind: 'product',
    checkIds: [],
    measurement: 'html',
  },
  {
    userLabel: 'SEO Health Score (A–F grade)',
    free: true,
    pro: true,
    kind: 'audit',
    checkIds: ['title', 'description', 'canonical', 'h1', 'duplicate-titles', 'duplicate-descriptions', 'duplicate-h1'],
    measurement: 'html',
  },
  {
    userLabel: 'Title, meta & canonical checks',
    free: true,
    pro: true,
    kind: 'audit',
    checkIds: ['title', 'description', 'canonical', 'meta-robots', 'duplicate-titles', 'duplicate-descriptions', 'canonical-gaps', 'canonical-conflicts'],
    measurement: 'html',
  },
  {
    userLabel: 'Social (OG + Twitter Cards)',
    free: true,
    pro: true,
    kind: 'audit',
    checkIds: ['og-tags', 'twitter-cards'],
    measurement: 'html',
  },
  {
    userLabel: 'Content & heading analysis',
    free: true,
    pro: true,
    kind: 'audit',
    checkIds: ['h1', 'heading-hierarchy', 'duplicate-h1'],
    measurement: 'html',
  },
  {
    userLabel: 'Accessibility (WCAG hints)',
    free: false,
    pro: true,
    kind: 'audit',
    checkIds: ['html-lang', 'skip-nav', 'semantic-html', 'form-labels', 'aria'],
    measurement: 'html',
  },
  {
    userLabel: 'Performance hints (HTML only)',
    free: false,
    pro: true,
    kind: 'audit',
    checkIds: ['lazy-loading', 'render-blocking', 'resource-hints'],
    measurement: 'html',
  },
  {
    userLabel: 'HTTP status, redirects & soft 404s',
    free: true,
    pro: true,
    kind: 'audit',
    checkIds: ['http-status', 'redirect-chain', 'fetch-error', 'soft-404'],
    measurement: 'html',
  },
  {
    userLabel: 'Security headers audit',
    free: false,
    pro: true,
    kind: 'audit',
    checkIds: ['ssl', 'hsts', 'security-headers'],
    measurement: 'html',
  },
  {
    userLabel: 'Structured data / JSON-LD',
    free: false,
    pro: true,
    kind: 'audit',
    checkIds: ['schema', 'breadcrumb-schema', 'aggregate-rating'],
    measurement: 'html',
  },
  {
    userLabel: 'Internal link hints',
    free: false,
    pro: true,
    kind: 'audit',
    checkIds: ['internal-links', 'anchor-text', 'placeholder-links'],
    measurement: 'html',
  },
  {
    userLabel: 'Image optimisation insights',
    free: false,
    pro: true,
    kind: 'audit',
    checkIds: ['img-alt'],
    measurement: 'html',
  },
  {
    userLabel: 'AI search eligibility (heuristic)',
    free: false,
    pro: true,
    kind: 'audit',
    checkIds: ['ai-snippet-eligible', 'ai-bots-robots', 'ai-extractable-text'],
    measurement: 'html',
  },
  {
    userLabel: 'Copy failed checks as a prompt',
    free: false,
    pro: true,
    kind: 'product',
    checkIds: ['title', 'schema'],
    measurement: 'html',
  },
  {
    userLabel: 'Export report to PDF',
    free: false,
    pro: true,
    kind: 'product',
    checkIds: [],
    measurement: 'html',
  },
]

export const HOBBY_BULLETS = [
  '3 scans total',
  'Up to 50 pages per scan',
  'Full SEO Health Score (A–F)',
  'Meta, title & canonical checks',
  'Open Graph & Twitter Cards',
  'Content & heading analysis',
]

export const PRO_BULLETS = [
  'Unlimited scans',
  '500 pages crawled per scan (sitemap-seeded)',
  'HTML SEO checks (title, meta, headings)',
  'Performance hints (lazy-load, render-blocking)',
  'Accessibility (WCAG) hints',
  'Security headers analysis',
  'JSON-LD required-property checks',
  'Image alt & dimension hints',
  'AI search eligibility heuristics (not a GEO score)',
  'Copy failed checks as a prompt',
  'PDF report export',
]
