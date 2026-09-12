/** Single public origin for metadata, canonicals, sitemap, robots, and JSON-LD. */
export const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://seoboost.app'
).replace(/\/$/, '')
