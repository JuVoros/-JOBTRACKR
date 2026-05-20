import type { Status } from '../types'
import { STATUS_CONFIG } from '../types'

// Static decorative entries — real markup, not a screenshot.
// Mid-century company names reinforce the ledger aesthetic.
const SAMPLE_ENTRIES: { company: string; role: string; status: Status; date: string }[] = [
  { company: 'Meridian Capital',   role: 'Senior Product Manager',  status: 'interview', date: '4 Jan' },
  { company: 'Holbrook Labs',      role: 'Staff Engineer',          status: 'applied',   date: '8 Jan' },
  { company: 'Crane & Associates', role: 'Engineering Lead',        status: 'offer',     date: '11 Jan' },
  { company: 'Vantage Health',     role: 'Principal Designer',      status: 'applied',   date: '14 Jan' },
  { company: 'Northfield Studio',  role: 'Frontend Engineer',       status: 'rejected',  date: '17 Jan' },
  { company: 'Aldgate Partners',   role: 'Data Scientist',          status: 'interview', date: '19 Jan' },
  { company: 'Pemberton Trust',    role: 'Product Designer',        status: 'applied',   date: '21 Jan' },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">

      {/* ── Mobile / tablet: single centered column ── */}
      <div className="lg:hidden flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <AuthWordmark />
        <div className="mt-10 w-full max-w-sm">
          {children}
        </div>
      </div>

      {/* ── Desktop: left decorative panel + right form ── */}
      <div className="hidden lg:grid lg:min-h-screen lg:grid-cols-[2fr_3fr]">

        {/* Left — decorative ledger */}
        <div className="relative flex flex-col border-r border-rule bg-paper-dark overflow-hidden">
          <div className="px-10 pt-10 pb-6">
            <AuthWordmark />
          </div>

          {/* Ledger rows */}
          <div className="flex-1 overflow-hidden">
            {SAMPLE_ENTRIES.map((entry, i) => {
              const cfg = STATUS_CONFIG[entry.status]
              return (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 border-b border-rule px-10 py-3"
                  style={{ opacity: Math.max(0.18, 0.72 - i * 0.08) }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink leading-tight">
                      {entry.company}
                    </p>
                    <p className="truncate font-mono text-[11px] text-ink-mid mt-0.5">
                      {entry.role}
                      <span className="mx-2 text-rule">·</span>
                      {entry.date}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex rounded-[2px] border px-2 py-0.5 font-mono text-[10px] tracking-[0.15em] ${cfg.bg} ${cfg.text} ${cfg.border}`}
                  >
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Fade mask at the bottom */}
          <div
            className="pointer-events-none absolute bottom-0 inset-x-0 h-48"
            style={{
              background: 'linear-gradient(to top, var(--color-paper-dark) 0%, transparent 100%)',
            }}
          />
        </div>

        {/* Right — form */}
        <div className="flex items-center justify-center px-12 py-12">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>
      </div>

    </div>
  )
}

// The wordmark + its short centering rule.
// Exported so pages can optionally reference the visual rhythm.
function AuthWordmark() {
  return (
    <div className="text-center">
      <span className="font-display text-2xl italic font-semibold tracking-wide text-ink">
        JobTrackr
      </span>
      <div className="mx-auto mt-3 h-px w-2/5 bg-rule" />
    </div>
  )
}
