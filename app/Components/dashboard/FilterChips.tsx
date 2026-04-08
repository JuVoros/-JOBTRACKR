'use client'

import { motion } from 'framer-motion'
import type { Status } from '../../types'
import { STATUS_CONFIG } from '../../types'

type Filter = 'all' | Status

interface FilterChipsProps {
  active: Filter
  onChange: (filter: Filter) => void
  counts: Record<Filter, number>
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'applied', label: 'Applied' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offer' },
  { key: 'rejected', label: 'Rejected' },
]

export default function FilterChips({ active, onChange, counts }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map(({ key, label }) => {
        const isActive = active === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`relative flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors ${
              isActive
                ? 'border-[#7F77DD]/30 text-[#e4e4e7]'
                : 'border-white/5 text-[#71717a] hover:border-white/10 hover:text-[#a1a1aa]'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="filter-pill"
                className="absolute inset-0 rounded-full bg-[#7F77DD]/10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative">{label}</span>
            <span className={`relative tabular-nums ${isActive ? 'text-[#7F77DD]' : 'text-[#52525b]'}`}>
              {counts[key]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
