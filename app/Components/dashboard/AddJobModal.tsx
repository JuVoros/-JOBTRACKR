'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { addJob } from '../../actions/jobs'
import type { Status } from '../../types'
import { STATUS_CONFIG, STATUSES } from '../../types'

interface AddJobModalProps {
  open: boolean
  onClose: () => void
}

const inputClasses =
  'h-11 w-full border border-rule bg-paper px-3 font-sans text-sm text-ink outline-none placeholder:text-rule transition-colors focus:border-ink'

export default function AddJobModal({ open, onClose }: AddJobModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<Status>('applied')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedStatus('applied')
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }
      document.addEventListener('keydown', handler)
      return () => document.removeEventListener('keydown', handler)
    }
  }, [open, onClose])

  const handleSubmit = async (formData: FormData) => {
    setPending(true)
    try {
      await addJob(formData)
      onClose()
    } finally {
      setPending(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — no blur, flat ink tint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/25"
          />

          {/* Sheet: slides up from bottom on mobile, centered on sm+ */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2"
          >
            <div className="border border-rule bg-paper p-6">
              {/* Mobile drag hint */}
              <div className="mx-auto mb-5 h-px w-10 bg-rule sm:hidden" />

              <div className="mb-6 flex items-center justify-between">
                <p className="font-display text-xl italic font-semibold text-ink">
                  New entry
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="font-mono text-[10px] tracking-widest uppercase text-ink-mid hover:text-ink transition-colors"
                  aria-label="Close"
                >
                  ESC
                </button>
              </div>

              <form action={handleSubmit} className="space-y-5">
                {/* Company */}
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] tracking-widest uppercase text-ink-mid">
                    Company *
                  </label>
                  <input
                    type="text"
                    name="company"
                    required
                    autoComplete="organization"
                    className={inputClasses}
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] tracking-widest uppercase text-ink-mid">
                    Role *
                  </label>
                  <input
                    type="text"
                    name="role"
                    required
                    className={inputClasses}
                  />
                </div>

                {/* Status selector — stamp-style radio buttons */}
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] tracking-widest uppercase text-ink-mid">
                    Status *
                  </label>
                  <input type="hidden" name="status" value={selectedStatus} />
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => {
                      const cfg = STATUS_CONFIG[s]
                      const isSelected = selectedStatus === s
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedStatus(s)}
                          className={`rounded-[2px] border px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] transition-colors ${
                            isSelected
                              ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                              : 'border-rule text-ink-mid hover:border-ink-mid'
                          }`}
                        >
                          {cfg.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Date applied */}
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] tracking-widest uppercase text-ink-mid">
                    Date applied *
                  </label>
                  <input
                    type="date"
                    name="appliedDate"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className={`${inputClasses} font-mono`}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] tracking-widest uppercase text-ink-mid">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Recruiter name, referral, prep notes..."
                    className="w-full resize-none border border-rule bg-paper px-3 py-2.5 font-sans text-sm text-ink outline-none placeholder:text-rule transition-colors focus:border-ink"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full bg-stamp-red py-3 font-mono text-[10px] tracking-widest uppercase text-paper transition-colors hover:bg-stamp-red/90 disabled:opacity-50"
                >
                  {pending ? 'Adding...' : 'Add to register'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
