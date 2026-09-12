import { HOBBY_MAX_PAGES, PRO_MAX_PAGES } from '@/lib/crawl-limits'
import {
  FREE_SCAN_LIMIT,
  gradeFromScore,
  gradeTone,
  hobbyScansRemaining,
} from './report-list-data'

export function AccountWidgets({
  totalScans,
  avgScore,
  subscriptionPlan,
}: {
  totalScans: number
  avgScore: number | null
  subscriptionPlan: string
}) {
  const isPro = subscriptionPlan === 'pro'
  const pageCap = isPro ? PRO_MAX_PAGES : HOBBY_MAX_PAGES
  const remaining = isPro ? null : hobbyScansRemaining(totalScans)
  const grade = avgScore == null ? null : gradeFromScore(avgScore)

  const stats = [
    {
      label: 'Scans',
      value: String(totalScans),
      suffix: isPro ? '' : `/${FREE_SCAN_LIMIT}`,
      description: isPro
        ? 'Unlimited on Pro'
        : remaining === 0
          ? 'Hobby limit reached'
          : `${remaining} left on Hobby`,
    },
    {
      label: 'Avg. grade',
      value: grade ?? '—',
      suffix: avgScore == null ? '' : `${avgScore}/100`,
      description:
        avgScore == null ? 'No finished scans yet' : 'Finished reports only',
      tone: grade ? gradeTone(grade) : undefined,
    },
    {
      label: 'Plan',
      value: isPro ? 'Pro' : 'Hobby',
      suffix: '',
      description: `${pageCap} pages per scan`,
    },
  ]

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-3xl border border-border bg-card p-5"
        >
          <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {stat.label}
          </p>
          <p
            className="font-display text-3xl leading-none tracking-tight"
            style={stat.tone ? { color: stat.tone } : undefined}
          >
            {stat.value}
            {stat.suffix ? (
              <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">
                {stat.suffix}
              </span>
            ) : null}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{stat.description}</p>
        </div>
      ))}
    </div>
  )
}
