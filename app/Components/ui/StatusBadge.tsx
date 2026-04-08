'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Status, STATUS_CONFIG } from '../../types'

interface StatusBadgeProps {
  status: Status
  onClick?: () => void
}

// Sparkle/shine lines that fire on tap
function ShineEffect() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Horizontal shine sweep */}
      <motion.div
        className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        initial={{ left: '-2rem' }}
        animate={{ left: '120%' }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
      {/* Corner sparkle particles */}
      {[
        { x: -6, y: -6, delay: 0 },
        { x: 8, y: -8, delay: 0.05 },
        { x: 10, y: 5, delay: 0.08 },
        { x: -8, y: 6, delay: 0.03 },
      ].map((spark, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-white"
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: spark.x * 2.5,
            y: spark.y * 2.5,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.45, delay: spark.delay, ease: 'easeOut' }}
        />
      ))}
    </motion.div>
  )
}

export default function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const [shineKey, setShineKey] = useState(0)

  const handleClick = () => {
    if (onClick) {
      setShineKey((k) => k + 1)
      onClick()
    }
  }

  return (
    <motion.button
      layout
      type="button"
      onClick={handleClick}
      className={`relative inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${config.bg} ${config.text} ${config.border} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      whileHover={onClick ? { scale: 1.08 } : undefined}
      whileTap={onClick ? { scale: 0.92 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {/* Ambient glow behind badge */}
      {onClick && (
        <motion.div
          className="pointer-events-none absolute -inset-1 rounded-full opacity-0"
          style={{
            background: `radial-gradient(ellipse, currentColor, transparent 70%)`,
            filter: 'blur(6px)',
          }}
          animate={{
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Shine/sparkle on status change */}
      <AnimatePresence>
        <ShineEffect key={shineKey} />
      </AnimatePresence>

      <span className="relative">{config.label}</span>

      {/* Small chevron hint */}
      {onClick && (
        <svg className="relative opacity-50" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )}
    </motion.button>
  )
}
