'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import StatusBadge from '../ui/StatusBadge'
import { updateJob, deleteJob } from '../../actions/jobs'
import { STATUSES, STATUS_CONFIG } from '../../types'
import type { Status } from '../../types'

interface Doc {
  id: string
  type: string
  createdAt: string
}

interface JobDetail {
  id: string
  company: string
  role: string
  status: string
  notes: string | null
  appliedDate: string
  generatedDocs: Doc[]
}

const PIPELINE: Status[] = ['applied', 'interview', 'offer']

const DOC_TYPE_LABELS: Record<string, string> = {
  cover_letter: 'Cover Letter',
  resume_summary: 'Resume Summary',
  follow_up: 'Follow-up Email',
  linkedin_message: 'LinkedIn Message',
  thank_you: 'Thank-you Note',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  })
}

function SectionHeader({ title, note }: { title: string; note?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-rule pb-2">
      <span className="font-mono text-[10px] tracking-widest uppercase text-ink-mid">{title}</span>
      {note && <span className="font-mono text-[10px] text-rule">{note}</span>}
    </div>
  )
}

export default function ApplicationDetail({ job }: { job: JobDetail }) {
  const router = useRouter()
  const [status, setStatus] = useState(job.status)
  const [notes, setNotes] = useState(job.notes ?? '')
  const [notesDirty, setNotesDirty] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)

  const cycleStatus = () => {
    const next = STATUSES[(STATUSES.indexOf(status as Status) + 1) % STATUSES.length]
    setStatus(next)
    startTransition(async () => {
      await updateJob(job.id, { status: next })
    })
  }

  const saveNotes = () => {
    if (!notesDirty) return
    startTransition(async () => {
      await updateJob(job.id, { notes: notes || null })
      setNotesDirty(false)
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 2000)
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteJob(job.id)
      router.replace('/dashboard')
    } catch {
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  const pipelineIdx = PIPELINE.indexOf(status as Status)
  const isRejected = status === 'rejected'

  return (
    <div className="space-y-8">

      {/* ── Back nav ── */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-ink-mid transition-colors hover:text-ink"
      >
        <span className="text-rule">←</span>
        Register
      </Link>

      {/* ── Header ── */}
      <div className="border-b border-rule pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold italic leading-tight text-ink">
              {job.company}
            </h1>
            <p className="mt-1 font-mono text-[11px] text-ink-mid">{job.role}</p>
          </div>
          <StatusBadge status={status} onClick={cycleStatus} />
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-rule">
          Applied {formatDate(job.appliedDate)}
        </p>
      </div>

      {/* ── Stage pipeline ── */}
      <section className="space-y-4">
        <SectionHeader title="Pipeline" />

        {isRejected ? (
          <div className="flex items-center gap-3 pt-2">
            <span className={`inline-flex rounded-[2px] border px-2 py-0.5 font-mono text-[10px] tracking-[0.15em] ${STATUS_CONFIG.rejected.bg} ${STATUS_CONFIG.rejected.text} ${STATUS_CONFIG.rejected.border}`}>
              REJECTED
            </span>
            <span className="font-mono text-[10px] text-rule">Application closed.</span>
          </div>
        ) : (
          <div className="flex items-stretch border border-rule mt-2">
            {PIPELINE.map((stage, i) => {
              const isPast    = i < pipelineIdx
              const isCurrent = i === pipelineIdx
              const isFuture  = i > pipelineIdx
              const cfg = STATUS_CONFIG[stage]
              return (
                <div
                  key={stage}
                  className={`flex-1 px-3 py-3 border-r border-rule last:border-r-0 ${
                    isCurrent ? 'bg-paper-alt' : ''
                  }`}
                >
                  <p className={`font-mono text-[9px] tracking-widest uppercase ${
                    isCurrent ? 'text-ink' : isPast ? 'text-ink-mid' : 'text-rule'
                  }`}>
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <p className={`mt-0.5 font-mono text-[10px] tracking-widest uppercase ${
                    isCurrent ? `${cfg.text} font-medium` : isPast ? 'text-ink-mid' : 'text-rule'
                  }`}>
                    {cfg.label}
                  </p>
                  {isCurrent && (
                    <div className={`mt-1.5 h-[2px] w-full ${cfg.text.replace('text-', 'bg-')}`} />
                  )}
                  {isPast && (
                    <p className="mt-1 font-mono text-[9px] text-rule">✓</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Notes ── */}
      <section className="space-y-3">
        <SectionHeader title="Notes" />
        <textarea
          rows={5}
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); setNoteSaved(false) }}
          placeholder="Add notes about this application — contacts, follow-ups, impressions..."
          className="w-full resize-none border border-rule bg-paper px-3 py-2.5 font-sans text-sm leading-relaxed text-ink outline-none placeholder:text-rule transition-colors focus:border-ink"
        />
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={saveNotes}
            disabled={!notesDirty || isPending}
            className="border border-stamp-red bg-stamp-red px-5 py-2 font-mono text-[10px] tracking-widest uppercase text-paper transition-colors hover:bg-stamp-red/90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isPending ? 'Saving...' : 'Save notes'}
          </button>
          {noteSaved && (
            <span className="font-mono text-[11px] text-ink-mid">Saved.</span>
          )}
        </div>
      </section>

      {/* ── Generated documents ── */}
      <section className="space-y-0">
        <SectionHeader
          title="Documents"
          note={job.generatedDocs.length > 0 ? `${job.generatedDocs.length} generated` : undefined}
        />
        {job.generatedDocs.length > 0 ? (
          <>
            {job.generatedDocs.map((doc) => (
              <div
                key={doc.id}
                className="ledger-row flex items-center justify-between gap-4 border-b border-rule py-3"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {DOC_TYPE_LABELS[doc.type] ?? doc.type}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-rule">{formatDate(doc.createdAt)}</p>
                </div>
                <Link
                  href={`/generate/${job.id}`}
                  className="shrink-0 font-mono text-[10px] tracking-widest uppercase text-ink-mid transition-colors hover:text-stamp-blue"
                >
                  View →
                </Link>
              </div>
            ))}
            <div className="pt-4">
              <Link
                href={`/generate/${job.id}`}
                className="font-mono text-[10px] tracking-widest uppercase text-ink-mid transition-colors hover:text-stamp-blue"
              >
                Open generator →
              </Link>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between py-4">
            <p className="font-mono text-[11px] text-rule">No documents generated yet.</p>
            <Link
              href={`/generate/${job.id}`}
              className="inline-flex items-center border border-stamp-red bg-stamp-red px-5 py-2 font-mono text-[10px] tracking-widest uppercase text-paper transition-colors hover:bg-stamp-red/90"
            >
              Generate documents →
            </Link>
          </div>
        )}
      </section>

      {/* ── Danger zone ── */}
      <div className="border-t border-rule pt-6">
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="font-mono text-[10px] tracking-widest uppercase text-rule transition-colors hover:text-stamp-red"
        >
          Delete entry
        </button>
      </div>

      {/* ── Delete confirmation ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            key="delete-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4"
            onClick={() => !isDeleting && setConfirmDelete(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm border border-rule bg-paper p-6"
            >
              <p className="mb-3 font-mono text-[10px] tracking-widest uppercase text-ink-mid">
                Confirm deletion
              </p>
              <p className="font-display text-xl font-semibold italic text-ink">{job.company}</p>
              <p className="font-mono text-xs text-ink-mid mt-0.5">{job.role}</p>
              <p className="mt-3 font-sans text-sm text-ink-mid">
                This entry and all generated documents will be permanently removed from the register.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                  className="flex-1 border border-rule py-2.5 font-mono text-xs tracking-widest uppercase text-ink-mid transition-colors hover:bg-paper-alt disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-stamp-red py-2.5 font-mono text-xs tracking-widest uppercase text-paper transition-colors hover:bg-stamp-red/90 disabled:opacity-60"
                >
                  {isDeleting ? 'Removing...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
