'use client'

import { useState, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { Application, Status } from '../../types'
import StatsRow from './StatsRow'
import FilterChips from './FilterChips'
import ApplicationCard from './ApplicationCard'
import AddJobModal from './AddJobModal'
import EmptyState from './EmptyState'

type Filter = 'all' | Status

interface DashboardClientProps {
  jobs: Application[]
}

export default function DashboardClient({ jobs }: DashboardClientProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(
    () => (filter === 'all' ? jobs : jobs.filter((j) => j.status === filter)),
    [jobs, filter]
  )

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: jobs.length,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    }
    for (const j of jobs) {
      if (j.status in c) c[j.status as Status]++
    }
    return c
  }, [jobs])

  return (
    <>
      <div className="space-y-6">
        <StatsRow jobs={jobs} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <FilterChips active={filter} onChange={setFilter} counts={counts} />
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="hidden h-9 items-center gap-1.5 rounded-full bg-[#7F77DD] px-4 text-sm font-medium text-white transition-colors hover:bg-[#938BF0] sm:inline-flex"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add
          </button>
        </div>

        {jobs.length === 0 ? (
          <EmptyState onAdd={() => setModalOpen(true)} />
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-[#1a1a1e] px-6 py-16 text-center">
            <p className="text-sm text-[#52525b]">No {filter} applications.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((job, i) => (
                <ApplicationCard key={job.id} job={job} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="fixed bottom-16 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#7F77DD] text-white shadow-lg shadow-[#7F77DD]/20 transition-transform active:scale-95 sm:hidden"
        aria-label="Add application"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <AddJobModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
