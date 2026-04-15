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
        className={`group relative flex w-full min-w-0 max-w-full max-h-32 flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#1a1a1e] p-3 transition-colors hover:bg-[#222226] sm:max-h-none sm:p-5 ${saving ? 'opacity-70' : ''}`}
      >
        {/* Top row: company + status + (desktop-only) generate */}
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            {editingField === 'company' ? (
              <input
                ref={companyRef}
                type="text"
                defaultValue={data.company}
                autoFocus
                onBlur={(e) => handleBlur('company', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'company')}
                className="h-7 w-full rounded-lg bg-white/5 px-2 text-sm font-semibold text-[#e4e4e7] outline-none ring-1 ring-[#7F77DD]/40 sm:h-10 sm:px-3 sm:text-base"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingField('company')}
                className="block w-full min-w-0 truncate whitespace-nowrap text-left text-sm font-semibold leading-tight text-[#e4e4e7] hover:text-white sm:min-h-10 sm:text-base sm:leading-normal"
              >
                {data.company}
              </button>
            )}
          </div>

          <div className="flex flex-shrink-0 flex-col items-end gap-2">
            <StatusBadge status={data.status} onClick={cycleStatus} />
            <a
              href={`/generate/${data.id}`}
              className="hidden h-7 items-center gap-1 rounded-full border border-[#7F77DD]/25 bg-[#7F77DD]/10 px-2.5 text-[11px] font-medium text-[#AFA9EC] transition-colors hover:bg-[#7F77DD]/20 hover:text-[#d4d0f7] sm:inline-flex"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
              </svg>
              Generate
            </a>
          </div>
        </div>

        {/* Role — single line truncate */}
        <div className="mt-0.5 min-w-0 sm:mt-1">
          {editingField === 'role' ? (
            <input
              ref={roleRef}
              type="text"
              defaultValue={data.role}
              autoFocus
              onBlur={(e) => handleBlur('role', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'role')}
              className="h-7 w-full rounded-lg bg-white/5 px-2 text-xs text-[#a1a1aa] outline-none ring-1 ring-[#7F77DD]/40 sm:h-9 sm:px-3 sm:text-sm"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingField('role')}
              className="block w-full min-w-0 truncate whitespace-nowrap text-left text-xs leading-tight text-[#a1a1aa] hover:text-[#d4d4d8] sm:min-h-9 sm:text-sm sm:leading-normal"
            >
              {data.role}
            </button>
          )}
        </div>

        {/* Notes — 2-line clamp on mobile, compact leading */}
        <div className="mt-1 min-w-0 flex-1 sm:mt-2 sm:flex-none">
          {editingField === 'notes' ? (
            <textarea
              ref={notesRef}
              defaultValue={data.notes ?? ''}
              autoFocus
              rows={2}
              onBlur={(e) => handleBlur('notes', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'notes')}
              className="w-full resize-none rounded-lg bg-white/5 px-2 py-1.5 text-xs text-[#a1a1aa] outline-none ring-1 ring-[#7F77DD]/40 sm:px-3 sm:py-2 sm:text-sm"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingField('notes')}
              className="block w-full min-w-0 text-left text-xs leading-snug text-[#52525b] hover:text-[#71717a] sm:min-h-9 sm:text-sm sm:leading-relaxed"
            >
              <span
                className="block overflow-hidden"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  wordBreak: 'break-word',
                }}
              >
                {data.notes || 'Add notes...'}
              </span>
            </button>
          )}
        </div>

        {/* Footer: date + generate (mobile) + delete */}
        <div className="mt-1.5 flex flex-shrink-0 items-center justify-between gap-2 sm:mt-3">
          <span className="min-w-0 truncate text-[10px] text-[#52525b] sm:text-xs">
            {new Date(data.appliedDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <div className="flex flex-shrink-0 items-center gap-1">
            <a
              href={`/generate/${data.id}`}
              className="inline-flex h-6 items-center gap-1 rounded-full border border-[#7F77DD]/25 bg-[#7F77DD]/10 px-2 text-[10px] font-medium text-[#AFA9EC] transition-colors hover:bg-[#7F77DD]/20 hover:text-[#d4d0f7] sm:hidden"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
              </svg>
              Generate
            </a>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex h-6 items-center rounded-lg px-1.5 text-[10px] text-[#52525b] transition-colors hover:bg-[#A32D2D22] hover:text-[#F09595] sm:h-8 sm:px-2 sm:text-xs"
              aria-label="Delete application"
            >
              Delete
            </button>
          </div>
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
