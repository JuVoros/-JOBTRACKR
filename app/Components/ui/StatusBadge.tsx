'use client'

import type { Status } from '../../types'
import { STATUS_CONFIG } from '../../types'

interface StatusBadgeProps {
  status: Status
  onClick?: () => void
}

export default function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  const baseClasses = [
    'inline-flex items-center rounded-[2px] border px-2 py-0.5',
    'font-mono text-[10px] font-medium tracking-[0.15em]',
    'transition-colors duration-100',
    config.bg,
    config.text,
    config.border,
  ].join(' ')

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} cursor-pointer hover:brightness-95 active:brightness-90`}
        aria-label={`Status: ${config.label}. Click to cycle.`}
      >
        {config.label}
        <span className="ml-1.5 opacity-40 text-[8px]">▾</span>
      </button>
    )
  }

  return (
    <span className={`${baseClasses} cursor-default`}>
      {config.label}
    </span>
  )
}
