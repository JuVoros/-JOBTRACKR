'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  // Local deletion tracking so AnimatePresence can exit-animate the card even
  // while the server action revalidates the dashboard.
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

  // Debounce search (150ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim().toLowerCase()), 150)
    return () => clearTimeout(t)
  }, [searchInput])

  const visibleJobs = useMemo(
    () => jobs.filter((j) => !deletedIds.has(j.id)),
    [jobs, deletedIds]
  )

  const filtered = useMemo(() => {
    return visibleJobs.filter((j) => {
      const matchesStatus = filter === 'all' || j.status === filter
      if (!matchesStatus) return false
      if (!debouncedSearch) return true
      return (
        j.company.toLowerCase().includes(debouncedSearch) ||
        j.role.toLowerCase().includes(debouncedSearch)
      )
    })
  }, [visibleJobs, filter, debouncedSearch])

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: visibleJobs.length,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    }
    for (const j of visibleJobs) {
      if (j.status in c) c[j.status as Status]++
    }
    return c
  }, [visibleJobs])

  const handleDelete = useCallback((id: string) => {
    setDeletedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  return (
    <>
      <div className="w-full min-w-0 space-y-6">
        <StatsRow jobs={visibleJobs} />

        {/* Search */}
        <div className="relative">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52525b]"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search companies or roles..."
            className="h-11 w-full rounded-xl border border-white/5 bg-[#1a1a1e] pl-10 pr-10 text-sm text-[#e4e4e7] placeholder:text-[#52525b] outline-none transition-colors focus:border-[#7F77DD]/40 focus:ring-1 focus:ring-[#7F77DD]/40"
          />
          <AnimatePresence>
            {searchInput && (
              <motion.button
                key="clear"
                type="button"
                onClick={() => setSearchInput('')}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#71717a] transition-colors hover:bg-white/5 hover:text-[#e4e4e7]"
                aria-label="Clear search"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

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

        {visibleJobs.length === 0 ? (
          <EmptyState onAdd={() => setModalOpen(true)} />
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-[#1a1a1e] px-6 py-16 text-center">
            <p className="text-sm text-[#52525b]">
              {debouncedSearch
                ? `No applications match "${debouncedSearch}".`
                : `No ${filter} applications.`}
            </p>
          </div>
        ) : (
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((job, i) => (
                <ApplicationCard
                  key={job.id}
                  job={job}
                  index={i}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Mobile FAB — raised above the taller bottom nav */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#7F77DD] text-white shadow-lg shadow-[#7F77DD]/20 transition-transform active:scale-95 sm:hidden"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
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
