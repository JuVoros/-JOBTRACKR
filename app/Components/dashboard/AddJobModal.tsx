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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Mobile: bottom sheet / Desktop: centered modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2"
          >
            <div className="rounded-t-2xl border border-white/5 bg-[#1a1a1e] p-6 sm:rounded-2xl">
              {/* Drag handle (mobile) */}
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10 sm:hidden" />

              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#e4e4e7]">New application</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#71717a] transition-colors hover:bg-white/5 hover:text-[#e4e4e7]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <form action={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#71717a]">Company</label>
                  <input
                    type="text"
                    name="company"
                    required
                    placeholder="e.g. Stripe"
                    className="h-11 w-full rounded-xl border border-white/5 bg-[#0d0d0f] px-3 text-sm text-[#e4e4e7] outline-none placeholder:text-[#3f3f46] focus:border-[#7F77DD]/40 focus:ring-1 focus:ring-[#7F77DD]/40"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#71717a]">Role</label>
                  <input
                    type="text"
                    name="role"
                    required
                    placeholder="e.g. Frontend Engineer"
                    className="h-11 w-full rounded-xl border border-white/5 bg-[#0d0d0f] px-3 text-sm text-[#e4e4e7] outline-none placeholder:text-[#3f3f46] focus:border-[#7F77DD]/40 focus:ring-1 focus:ring-[#7F77DD]/40"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#71717a]">Status</label>
                  <input type="hidden" name="status" value={selectedStatus} />
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => {
                      const cfg = STATUS_CONFIG[s]
                      const active = selectedStatus === s
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedStatus(s)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                            active
                              ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                              : 'border-white/5 text-[#71717a] hover:border-white/10'
                          }`}
                        >
                          {cfg.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#71717a]">Date applied</label>
                  <input
                    type="date"
                    name="appliedDate"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="h-11 w-full rounded-xl border border-white/5 bg-[#0d0d0f] px-3 text-sm text-[#e4e4e7] outline-none focus:border-[#7F77DD]/40 focus:ring-1 focus:ring-[#7F77DD]/40"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#71717a]">Notes</label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Referral, recruiter name, prep notes..."
                    className="w-full resize-none rounded-xl border border-white/5 bg-[#0d0d0f] px-3 py-2.5 text-sm text-[#e4e4e7] outline-none placeholder:text-[#3f3f46] focus:border-[#7F77DD]/40 focus:ring-1 focus:ring-[#7F77DD]/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="h-11 w-full rounded-xl bg-[#7F77DD] text-sm font-semibold text-white transition-colors hover:bg-[#938BF0] disabled:opacity-50"
                >
                  {pending ? 'Adding...' : 'Add application'}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
