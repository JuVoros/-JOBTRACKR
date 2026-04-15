'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StatusBadge from '../ui/StatusBadge'
import { updateJob, deleteJob } from '../../actions/jobs'
import type { Application } from '../../types'
import { STATUSES } from '../../types'

interface ApplicationCardProps {
  job: Application
  index: number
  onDelete?: (id: string) => void
}

export default function ApplicationCard({ job, index, onDelete }: ApplicationCardProps) {
  const [data, setData] = useState(job)
  const [saving, setSaving] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const companyRef = useRef<HTMLInputElement>(null)
  const roleRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  const save = useCallback(
    async (updates: Partial<Pick<Application, 'company' | 'role' | 'status' | 'notes'>>) => {
      setSaving(true)
      try {
        await updateJob(data.id, updates)
        setData((prev) => ({ ...prev, ...updates }))
      } finally {
        setSaving(false)
        setEditingField(null)
      }
    },
    [data.id]
  )

  const cycleStatus = () => {
    const idx = STATUSES.indexOf(data.status)
    const next = STATUSES[(idx + 1) % STATUSES.length]
    setData((prev) => ({ ...prev, status: next }))
    save({ status: next })
  }

  const handleBlur = (field: 'company' | 'role' | 'notes', value: string) => {
    const trimmed = value.trim()
    if (field === 'notes') {
      if (trimmed !== (data.notes ?? '')) save({ notes: trimmed || null })
      else setEditingField(null)
    } else {
      if (trimmed && trimmed !== data[field]) save({ [field]: trimmed })
      else setEditingField(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' && field !== 'notes') {
      ;(e.target as HTMLElement).blur()
    }
    if (e.key === 'Escape') {
      setEditingField(null)
    }
  }

  const handleDeleteConfirm = async () => {
    setDeleting(true)
    try {
      await deleteJob(data.id)
      setConfirmDelete(false)
      // Notify parent so AnimatePresence can exit-animate the card out
      onDelete?.(data.id)
    } catch {
      setDeleting(false)
    }
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -8 }}
        transition={{ delay: Math.min(index, 12) * 0.04, duration: 0.22 }}
        whileHover={{ scale: 1.01 }}
        className={`group relative w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/5 bg-[#1a1a1e] p-4 transition-colors hover:bg-[#222226] sm:p-5 ${saving ? 'opacity-70' : ''}`}
      >
        {/* Top row: company + status + generate */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {editingField === 'company' ? (
              <input
                ref={companyRef}
                type="text"
                defaultValue={data.company}
                autoFocus
                onBlur={(e) => handleBlur('company', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'company')}
                className="h-10 w-full rounded-lg bg-white/5 px-3 text-base font-semibold text-[#e4e4e7] outline-none ring-1 ring-[#7F77DD]/40"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingField('company')}
                className="min-h-10 w-full truncate text-left text-base font-semibold text-[#e4e4e7] hover:text-white"
              >
                {data.company}
              </button>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={data.status} onClick={cycleStatus} />
            <a
              href={`/generate/${data.id}`}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-[#7F77DD]/25 bg-[#7F77DD]/10 px-2.5 text-[11px] font-medium text-[#AFA9EC] transition-colors hover:bg-[#7F77DD]/20 hover:text-[#d4d0f7]"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
              </svg>
              Generate
            </a>
          </div>
        </div>

        {/* Role */}
        <div className="mt-1">
          {editingField === 'role' ? (
            <input
              ref={roleRef}
              type="text"
              defaultValue={data.role}
              autoFocus
              onBlur={(e) => handleBlur('role', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'role')}
              className="h-9 w-full rounded-lg bg-white/5 px-3 text-sm text-[#a1a1aa] outline-none ring-1 ring-[#7F77DD]/40"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingField('role')}
              className="min-h-9 truncate text-left text-sm text-[#a1a1aa] hover:text-[#d4d4d8]"
            >
              {data.role}
            </button>
          )}
        </div>

        {/* Notes */}
        <div className="mt-2">
          {editingField === 'notes' ? (
            <textarea
              ref={notesRef}
              defaultValue={data.notes ?? ''}
              autoFocus
              rows={2}
              onBlur={(e) => handleBlur('notes', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'notes')}
              className="w-full resize-none rounded-lg bg-white/5 px-3 py-2 text-sm text-[#a1a1aa] outline-none ring-1 ring-[#7F77DD]/40"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingField('notes')}
              className="min-h-9 w-full text-left text-sm leading-relaxed text-[#52525b] hover:text-[#71717a]"
            >
              <span className="line-clamp-2">{data.notes || 'Add notes...'}</span>
            </button>
          )}
        </div>

        {/* Footer: date + delete */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-[#52525b]">
            {new Date(data.appliedDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex h-8 items-center rounded-lg px-2 text-xs text-[#52525b] transition-colors hover:bg-[#A32D2D22] hover:text-[#F09595]"
            aria-label="Delete application"
          >
            Delete
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            key={`delete-confirm-${data.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={() => !deleting && setConfirmDelete(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/5 bg-[#1a1a1e] p-6 shadow-2xl"
            >
              <h3 className="text-base font-semibold text-[#e4e4e7]">Delete this application?</h3>
              <p className="mt-1.5 text-sm text-[#71717a]">
                {data.company} &middot; {data.role}. This can&apos;t be undone.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="h-11 flex-1 rounded-xl border border-white/5 text-sm font-medium text-[#a1a1aa] transition-colors hover:bg-white/5 hover:text-[#e4e4e7] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="h-11 flex-1 rounded-xl bg-[#A32D2D] text-sm font-semibold text-white transition-colors hover:bg-[#BC3636] disabled:opacity-60"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
