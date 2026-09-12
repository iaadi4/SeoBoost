export const HOBBY_MAX_PAGES = 50
export const PRO_MAX_PAGES = 500
export const PAGES_PER_TICK = 15
export const MAX_SITEMAP_CHILD_FILES = 5
export const MAX_SITEMAP_SEED_LOCS = 2000

export function maxPagesForPlan(plan: string | null | undefined): number {
  return plan === 'pro' ? PRO_MAX_PAGES : HOBBY_MAX_PAGES
}

export function canTickReport(
  report: { userId: string; status: string },
  userId: string
): boolean {
  return report.userId === userId && report.status === 'running'
}
