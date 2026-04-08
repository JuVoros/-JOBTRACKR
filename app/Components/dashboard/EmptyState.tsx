'use client'

import { motion } from 'framer-motion'

interface EmptyStateProps {
  onAdd: () => void
}

export default function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#1a1a1e] px-6 py-20 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7F77DD]/10"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.div>
      <p className="max-w-xs text-sm text-[#71717a]">
        No applications yet — tap{' '}
        <button type="button" onClick={onAdd} className="font-medium text-[#7F77DD] hover:text-[#938BF0]">
          +
        </button>{' '}
        to add your first one.
      </p>
    </motion.div>
  )
}
