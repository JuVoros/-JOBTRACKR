'use client'

import type { Status } from '../../types'

type Filter = 'all' | Status

interface FilterChipsProps {
  active: Filter
  onChange: (filter: Filter) => void
  counts: Record<Filter, number>
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'ALL' },
  { key: 'applied',   label: 'APPLIED' },
  { key: 'interview', label: 'INTERVIEW' },
  { key: 'offer',     label: 'OFFER' },
  { key: 'rejected',  label: 'REJECTED' },
]

export default function FilterChips({ active, onChange, counts }: FilterChipsProps) {
  return (
    <div className="flex items-end gap-0 overflow-x-auto">
      {FILTERS.map(({ key, label }) => {
        const isActive = active === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`relative shrink-0 px-4 pb-2 pt-1 font-mono text-[10px] tracking-widest transition-colors ${
              isActive ? 'text-ink' : 'text-ink-mid hover:text-ink'
            }`}
          >
            {label}
            <span className="ml-2 tabular-nums">{counts[key]}</span>
            {isActive && (
              <span className="absolute bottom-0 inset-x-0 h-[2px] bg-ink" />
            )}
          </button>
        )
      })}
    </div>
  )
}
