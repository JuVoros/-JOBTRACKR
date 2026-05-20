import Link from 'next/link'
import type { Status } from './types'
import { STATUS_CONFIG } from './types'

// ── Static preview entries — real markup, not a screenshot ────────────────
const PREVIEW_ENTRIES: { company: string; role: string; status: Status; date: string; days: number }[] = [
  { company: 'Meridian Capital',   role: 'Senior Product Manager',  status: 'interview', date: '4 Jan',  days: 18 },
  { company: 'Holbrook Labs',      role: 'Staff Engineer',          status: 'applied',   date: '8 Jan',  days: 14 },
  { company: 'Crane & Associates', role: 'Engineering Lead',        status: 'offer',     date: '11 Jan', days: 11 },
  { company: 'Vantage Health',     role: 'Principal Designer',      status: 'applied',   date: '14 Jan', days: 8  },
  { company: 'Northfield Studio',  role: 'Frontend Engineer',       status: 'rejected',  date: '17 Jan', days: 5  },
  { company: 'Aldgate Partners',   role: 'Data Scientist',          status: 'interview', date: '19 Jan', days: 3  },
]

// ── How it works — three ledger steps ────────────────────────────────────
const STEPS = [
  { n: '01', title: 'Add every application',        note: 'Company, role, date, status — nothing else required.' },
  { n: '02', title: 'Track status and time',         note: 'See exactly how long each application has been sitting.' },
  { n: '03', title: 'Know what needs attention',     note: 'Stale applications surface automatically.' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-paper text-ink">

      {/* ── Header ── */}
      <header className="flex h-14 items-center justify-between border-b border-rule px-6 lg:px-10">
        <span className="font-display text-lg italic font-semibold tracking-wide text-ink">
          JobTrackr
        </span>
        <Link
          href="/login"
          className="font-mono text-[10px] tracking-widest uppercase text-ink-mid hover:text-ink transition-colors"
        >
          Sign in
        </Link>
      </header>

      {/* ── Hero ── */}
      {/*
        Mobile/tablet: stacked — headline, then ledger preview (overflowing right), then CTA.
        Desktop: left 2/5 headline + CTA, right 3/5 ledger preview bleeding to viewport edge.
      */}
      <section className="lg:grid lg:grid-cols-[2fr_3fr] lg:min-h-[calc(100vh-3.5rem)]">

        {/* Left: headline + CTA */}
        <div className="flex flex-col justify-center px-6 pt-14 pb-8 lg:px-10 lg:py-0">
          <p className="font-mono text-[10px] tracking-widest uppercase text-ink-mid mb-4">
            Job application tracker
          </p>
          <h1 className="font-display leading-tight text-ink">
            <span className="block text-5xl font-light italic lg:text-6xl">
              Your job search,
            </span>
            <span className="block text-5xl font-bold lg:text-6xl">
              on the record.
            </span>
          </h1>
          <p className="mt-6 max-w-xs font-sans text-sm font-light leading-relaxed text-ink-mid">
            One clear register for every application you&apos;ve sent.
            Know what&apos;s active, what&apos;s stale, and what needs a follow-up.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center bg-stamp-red px-6 py-3 font-mono text-[10px] tracking-widest uppercase text-paper transition-colors hover:bg-stamp-red/90"
            >
              Start free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center border border-rule px-6 py-3 font-mono text-[10px] tracking-widest uppercase text-ink-mid transition-colors hover:border-ink hover:text-ink"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Right: ledger preview — bleeds to viewport edge on desktop */}
        <div className="relative overflow-hidden border-t border-rule lg:border-t-0 lg:border-l">

          {/* Mobile: slight tilt + right overflow */}
          <div
            className="lg:hidden px-6 pt-10 pb-14"
            style={{ transform: 'rotate(1deg)', transformOrigin: 'top left' }}
          >
            <PreviewLedger />
          </div>

          {/* Desktop: flush, no rotation, fills the panel */}
          <div className="hidden lg:flex lg:flex-col lg:h-full lg:justify-center">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_88px_52px_120px] border-b border-rule bg-paper-alt px-6 py-2">
              {['Company / Role', 'Applied', 'Days', 'Status'].map((h) => (
                <span key={h} className="font-mono text-[10px] tracking-widest uppercase text-ink-mid">
                  {h}
                </span>
              ))}
            </div>
            <PreviewLedger desktop />
          </div>

          {/* Fade mask — bottom */}
          <div
            className="pointer-events-none absolute bottom-0 inset-x-0 h-32 lg:h-48"
            style={{ background: 'linear-gradient(to top, var(--color-paper) 0%, transparent 100%)' }}
          />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-rule px-6 py-16 lg:px-10">
        <p className="mb-8 font-mono text-[10px] tracking-widest uppercase text-ink-mid">
          How it works
        </p>
        <div className="max-w-2xl">
          {STEPS.map(({ n, title, note }, i) => (
            <div
              key={n}
              className={`flex gap-6 py-5 ${i < STEPS.length - 1 ? 'border-b border-rule' : ''}`}
            >
              <span className="shrink-0 font-mono text-[11px] text-rule tabular-nums pt-px">
                {n}
              </span>
              <div>
                <p className="font-sans text-sm font-medium text-ink">{title}</p>
                <p className="mt-0.5 font-mono text-[11px] text-ink-mid">{note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-t border-rule px-6 py-16 lg:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-2xl italic font-light text-ink-mid">
            Ready to start tracking?
          </p>
          <Link
            href="/signup"
            className="inline-flex w-fit items-center bg-stamp-red px-6 py-3 font-mono text-[10px] tracking-widest uppercase text-paper transition-colors hover:bg-stamp-red/90"
          >
            Open your register →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-rule px-6 py-5 lg:px-10">
        <p className="font-mono text-[10px] text-rule">
          JobTrackr — built for job seekers, not hiring managers.
        </p>
      </footer>

    </div>
  )
}

// ── Shared ledger preview rows ─────────────────────────────────────────────
function PreviewLedger({ desktop = false }: { desktop?: boolean }) {
  return (
    <div>
      {PREVIEW_ENTRIES.map((entry, i) => {
        const cfg = STATUS_CONFIG[entry.status]
        const delay = `${i * 0.07 + 0.1}s`

        if (desktop) {
          return (
            <div
              key={entry.company}
              className="ledger-preview-row grid grid-cols-[1fr_88px_52px_120px] items-center border-b border-rule px-6 py-3"
              style={{ animationDelay: delay }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink leading-tight">{entry.company}</p>
                <p className="truncate font-mono text-[11px] text-ink-mid mt-0.5">{entry.role}</p>
              </div>
              <p className="font-mono text-[11px] text-ink-mid">{entry.date}</p>
              <p className="font-mono text-[11px] text-ink-mid tabular-nums">{entry.days}d</p>
              <span
                className={`inline-flex rounded-[2px] border px-2 py-0.5 font-mono text-[10px] tracking-[0.15em] ${cfg.bg} ${cfg.text} ${cfg.border}`}
              >
                {cfg.label}
              </span>
            </div>
          )
        }

        return (
          <div
            key={entry.company}
            className="ledger-preview-row flex items-center justify-between gap-3 border-b border-rule py-3"
            style={{ animationDelay: delay }}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink leading-tight">{entry.company}</p>
              <p className="truncate font-mono text-[11px] text-ink-mid mt-0.5">
                {entry.role}
                <span className="mx-1.5 text-rule">·</span>
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
  )
}
