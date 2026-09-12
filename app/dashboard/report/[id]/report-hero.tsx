'use client'

interface ReportHeroProps {
  score: number
  domain: string
  scannedAt: string
  domainUrl: string
}

function ScoreRing({ score }: { score: number }) {
  const r = 70
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference - (score / 100) * circumference
  const scoreColor =
    score >= 80 ? '#3d6b4f' : score >= 50 ? '#c47a4a' : '#b42318'

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke="#e6e1d8"
          strokeWidth="10"
        />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke={scoreColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-5xl tabular-nums" style={{ color: scoreColor }}>
          {score}
        </span>
        <span className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          / 100
        </span>
      </div>
    </div>
  )
}

export function ReportHero({ score, domain, scannedAt, domainUrl }: ReportHeroProps) {
  const scoreLabel =
    score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs work' : 'Critical'

  return (
    <div className="mb-8 overflow-hidden rounded-3xl border border-border bg-card print:hidden">
      <div className="flex flex-col items-center gap-8 p-8 md:flex-row">
        <div className="shrink-0">
          <ScoreRing score={score} />
        </div>

        <div className="flex-1 text-center md:text-left">
          <span className="mb-3 inline-block rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {scoreLabel}
          </span>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            <span className="mb-1 block text-xl font-normal text-muted-foreground">
              SEO audit
            </span>
            {domain}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Scanned {new Date(scannedAt).toLocaleString()}
          </p>
          <a
            href={domainUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-sm underline underline-offset-4"
          >
            Visit live site
          </a>
        </div>

        <div className="flex shrink-0 flex-col gap-3">
          <div className="mb-1 text-center text-xs uppercase tracking-[0.16em] text-muted-foreground">
            SEO health
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Score', val: `${score}` },
              {
                label: 'Grade',
                val:
                  score >= 90
                    ? 'A+'
                    : score >= 80
                      ? 'A'
                      : score >= 70
                        ? 'B'
                        : score >= 60
                          ? 'C'
                          : score >= 50
                            ? 'D'
                            : 'F',
              },
            ].map((chip) => (
              <div
                key={chip.label}
                className="rounded-2xl border border-border bg-background px-4 py-3 text-center"
              >
                <div className="font-display text-2xl">{chip.val}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {chip.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
