'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
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

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  })
}

export default function ApplicationCard({ job, index, onDelete }: ApplicationCardProps) {
  const [data, setData] = useState(job)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const save = useCallback(
    async (updates: Partial<Pick<Application, 'company' | 'role' | 'status' | 'notes'>>) => {
      setSaving(true)
      try {
        await updateJob(data.id, updates)
        setData((prev) => ({ ...prev, ...updates }))
      } finally {
        setSaving(false)
      }
    },
    [data.id]
  )

  const cycleStatus = () => {
    const next = STATUSES[(STATUSES.indexOf(data.status) + 1) % STATUSES.length]
    setData((prev) => ({ ...prev, status: next }))
    save({ status: next })
  }

  const handleDeleteConfirm = async () => {
    setDeleting(true)
    try {
      await deleteJob(data.id)
      onDelete?.(data.id)
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const days = daysSince(data.appliedDate)

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: saving ? 0.55 : 1 }}
        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
        transition={{ delay: Math.min(index, 12) * 0.025, duration: 0.18 }}
        className="ledger-row border-b border-rule group"
      >
        {/* ── Mobile layout ── */}
        <div className="md:hidden px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/applications/${data.id}`}
              className="truncate text-sm font-medium text-ink leading-tight hover:underline underline-offset-2"
            >
              {data.company}
            </Link>
            <StatusBadge status={data.status} onClick={cycleStatus} />
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p className="min-w-0 truncate font-mono text-[11px] text-ink-mid">
              {data.role}
              <span className="mx-1.5 text-rule">·</span>
              {formatDate(data.appliedDate)}
              <span className="mx-1.5 text-rule">·</span>
              {days}d
            </p>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="shrink-0 font-mono text-sm text-rule hover:text-stamp-red transition-colors leading-none"
              aria-label="Delete"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Desktop ledger row ── */}
        <div className="hidden md:grid md:grid-cols-[1fr_120px_72px_140px_80px] md:items-center">
          {/* Company + Role */}
          <div className="min-w-0 px-6 py-3">
            <Link
              href={`/applications/${data.id}`}
              className="block truncate text-sm font-medium text-ink leading-tight hover:underline underline-offset-2"
            >
              {data.company}
            </Link>
            <p className="truncate font-mono text-[11px] text-ink-mid mt-0.5">{data.role}</p>
          </div>

          {/* Applied date */}
          <div className="px-3 py-3 font-mono text-[11px] text-ink-mid">
            {formatDate(data.appliedDate)}
          </div>

          {/* Days in stage */}
          <div className="px-3 py-3 font-mono text-[11px] text-ink-mid tabular-nums">
            {days}d
          </div>

          {/* Status stamp */}
          <div className="px-3 py-3">
            <StatusBadge status={data.status} onClick={cycleStatus} />
          </div>

          {/* Actions — fade in on row hover */}
          <div className="flex items-center justify-end gap-3 px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
            <a
              href={`/generate/${data.id}`}
              className="font-mono text-[10px] tracking-widest uppercase text-ink-mid hover:text-stamp-blue transition-colors"
            >
              Generate
            </a>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="font-mono text-[10px] tracking-widest uppercase text-ink-mid hover:text-stamp-red transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Delete confirmation ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            key={`del-${data.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4"
            onClick={() => !deleting && setConfirmDelete(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm border border-rule bg-paper p-6"
            >
              <p className="font-mono text-[10px] tracking-widest uppercase text-ink-mid mb-3">
                Confirm deletion
              </p>
              <p className="font-display text-xl font-semibold italic text-ink">
                {data.company}
              </p>
              <p className="font-mono text-xs text-ink-mid mt-0.5">{data.role}</p>
              <p className="mt-3 font-sans text-sm text-ink-mid">
                This entry will be permanently removed from the register.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="flex-1 border border-rule py-2.5 font-mono text-xs tracking-widest uppercase text-ink-mid transition-colors hover:bg-paper-alt disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 bg-stamp-red py-2.5 font-mono text-xs tracking-widest uppercase text-paper transition-colors hover:bg-stamp-red/90 disabled:opacity-60"
                >
                  {deleting ? 'Removing...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
