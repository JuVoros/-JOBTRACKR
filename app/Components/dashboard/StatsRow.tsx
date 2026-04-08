'use client'

import { motion } from 'framer-motion'
import AnimatedNumber from '../ui/AnimatedNumber'
import type { Application, Status } from '../../types'
import { STATUS_CONFIG } from '../../types'

interface StatsRowProps {
  jobs: Application[]
}

const STAT_KEYS: Status[] = ['applied', 'interview', 'offer', 'rejected']

export default function StatsRow({ jobs }: StatsRowProps) {
  const counts = STAT_KEYS.reduce(
    (acc, s) => ({ ...acc, [s]: jobs.filter((j) => j.status === s).length }),
    {} as Record<Status, number>
  )

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {STAT_KEYS.map((key, i) => {
        const config = STATUS_CONFIG[key]
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
            className="rounded-2xl border border-white/5 bg-[#1a1a1e] p-4"
          >
            <p className={`text-xs font-medium ${config.text}`}>{config.label}</p>
            <AnimatedNumber
              value={counts[key]}
              className="mt-1 block text-2xl font-semibold text-[#e4e4e7] tabular-nums"
            />
          </motion.div>
        )
      })}
    </div>
  )
}
