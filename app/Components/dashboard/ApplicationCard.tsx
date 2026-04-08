'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import StatusBadge from '../ui/StatusBadge'
import { updateJob, deleteJob } from '../../actions/jobs'
import type { Application, Status } from '../../types'
import { STATUSES } from '../../types'

interface ApplicationCardProps {
  job: Application
  index: number
}

export default function ApplicationCard({ job, index }: ApplicationCardProps) {
  const [data, setData] = useState(job)
  const [saving, setSaving] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
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

  const handleDelete = async () => {
    if (!confirm('Delete this application?')) return
    await deleteJob(data.id)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(index, 12) * 0.04, duration: 0.2 }}
      whileHover={{ scale: 1.01 }}
      className={`group relative rounded-2xl border border-white/5 bg-[#1a1a1e] p-4 transition-colors hover:bg-[#222226] sm:p-5 ${saving ? 'opacity-70' : ''}`}
    >
      {/* Top row: company + status */}
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

        <StatusBadge status={data.status} onClick={cycleStatus} />
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
          onClick={handleDelete}
          className="flex h-8 items-center rounded-lg px-2 text-xs text-[#52525b] opacity-0 transition-all hover:bg-[#A32D2D22] hover:text-[#F09595] group-hover:opacity-100 sm:opacity-0"
          style={{ opacity: undefined }}
        >
          Delete
        </button>
      </div>
    </motion.div>
  )
}
