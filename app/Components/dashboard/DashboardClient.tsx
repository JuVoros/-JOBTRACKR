'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
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

// Shared column template for the ledger — header and rows must match
const LEDGER_COLS = 'md:grid-cols-[1fr_120px_72px_140px_80px]'

export default function DashboardClient({ jobs }: DashboardClientProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

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
    setDeletedIds((prev) => new Set([...prev, id]))
  }, [])

  return (
    <>
      <div className="w-full min-w-0 space-y-8">
        {/* Page title + desktop add button */}
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="font-display text-3xl font-light italic text-ink">
            Applications
          </h1>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="hidden sm:inline-flex border border-stamp-red px-4 py-2 font-mono text-[10px] tracking-widest uppercase text-stamp-red transition-colors hover:bg-stamp-red hover:text-paper"
          >
            + New entry
          </button>
        </div>

        {/* Pipeline summary */}
        <StatsRow jobs={visibleJobs} />

        {/* Search — bare underline, no box */}
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search company or role..."
            className="h-10 w-full border-b border-rule bg-transparent font-mono text-sm text-ink placeholder:text-rule outline-none focus:border-ink transition-colors pr-6"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-base text-ink-mid hover:text-ink transition-colors leading-none"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter tabs + entry count */}
        <div className="flex items-end justify-between gap-4 border-b border-rule">
          <FilterChips active={filter} onChange={setFilter} counts={counts} />
          <span className="hidden sm:block pb-2 font-mono text-[10px] tracking-widest text-ink-mid">
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* ── Ledger ── */}
        {visibleJobs.length === 0 ? (
          <EmptyState onAdd={() => setModalOpen(true)} />
        ) : filtered.length === 0 ? (
          <div className="border-b border-rule px-6 py-12 text-center">
            <p className="font-mono text-xs text-ink-mid">
              {debouncedSearch
                ? `No entries match "${debouncedSearch}"`
                : `No ${filter} entries`}
            </p>
          </div>
        ) : (
          <>
            {/* Table header — desktop only */}
            <div className={`hidden md:grid ${LEDGER_COLS} border-y border-rule bg-paper-alt`}>
              <div className="px-6 py-2 font-mono text-[10px] tracking-widest uppercase text-ink-mid">
                Company / Role
              </div>
              <div className="px-3 py-2 font-mono text-[10px] tracking-widest uppercase text-ink-mid">
                Applied
              </div>
              <div className="px-3 py-2 font-mono text-[10px] tracking-widest uppercase text-ink-mid">
                Days
              </div>
              <div className="px-3 py-2 font-mono text-[10px] tracking-widest uppercase text-ink-mid">
                Status
              </div>
              <div />
            </div>

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
          </>
        )}
      </div>

      {/* Mobile FAB — square, stamp-red border */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="fixed right-5 z-30 flex h-14 w-14 items-center justify-center border border-stamp-red bg-paper text-stamp-red transition-colors hover:bg-stamp-red hover:text-paper sm:hidden"
        style={{ bottom: 'calc(3.75rem + env(safe-area-inset-bottom))' }}
        aria-label="Add application"
      >
        <span className="font-mono text-2xl leading-none">+</span>
      </button>

      <AddJobModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
