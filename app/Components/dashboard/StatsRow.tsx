'use client'

import type { Application, Status } from '../../types'

interface StatsRowProps {
  jobs: Application[]
}

const STAT_KEYS: Status[] = ['applied', 'interview', 'offer', 'rejected']

const STAT_LABELS: Record<Status, string> = {
  applied:   'Applied',
  interview: 'Interviewing',
  offer:     'Offer',
  rejected:  'Rejected',
}

// Border classes per index for 2-col mobile → 4-col desktop
const BORDER_CLASSES = [
  'border-r border-b border-rule md:border-b-0',       // 0: right + bottom (mobile); right only (desktop)
  'border-b border-rule md:border-b-0 md:border-r',    // 1: bottom (mobile); right (desktop)
  'border-r border-rule',                               // 2: right always
  '',                                                   // 3: no border
]

export default function StatsRow({ jobs }: StatsRowProps) {
  const counts = STAT_KEYS.reduce(
    (acc, s) => ({ ...acc, [s]: jobs.filter((j) => j.status === s).length }),
    {} as Record<Status, number>
  )

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border border-rule">
      {STAT_KEYS.map((key, i) => (
        <div key={key} className={`px-5 py-4 ${BORDER_CLASSES[i]}`}>
          <p className="font-mono text-[10px] tracking-widest uppercase text-ink-mid">
            {STAT_LABELS[key]}
          </p>
          <p className="mt-1.5 font-display text-4xl font-bold text-ink tabular-nums leading-none">
            {counts[key]}
          </p>
        </div>
      ))}
    </div>
  )
}
