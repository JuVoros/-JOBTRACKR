'use client'

import { motion } from 'framer-motion'
import { Status, STATUS_CONFIG } from '../../types'

interface StatusBadgeProps {
  status: Status
  onClick?: () => void
}

export default function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <motion.button
      layout
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${config.bg} ${config.text} ${config.border} ${onClick ? 'cursor-pointer hover:brightness-125' : 'cursor-default'}`}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {config.label}
    </motion.button>
  )
}
