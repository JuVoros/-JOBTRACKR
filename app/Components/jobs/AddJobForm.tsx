'use client'

import { useState } from 'react'
import { addJob } from '../../actions/jobs'

const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
] as const

export default function AddJobForm() {
  const [pending, setPending] = useState(false)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold/40 bg-surface p-6 shadow-[0_0_0_3px_rgba(212,175,55,0.1),0_24px_48px_-28px_rgba(0,0,0,0.45)] sm:p-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-linear-to-r from-transparent via-gold to-transparent animate-gold-shimmer opacity-90"
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/5 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-gold/5 blur-2xl" aria-hidden />

      <div className="relative mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-gold-dark">
            Compose
          </p>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            New application
          </h2>
          <p className="mt-1 max-w-md text-sm text-ink-muted">
            Capture the role in one pass—status, date, and notes stay in sync with your pipeline.
          </p>
        </div>
        <div className="gold-rule shrink-0 sm:mx-0" aria-hidden />
      </div>

      <form
        action={async (formData) => {
          setPending(true)
          try {
            await addJob(formData)
          } finally {
            setPending(false)
          }
        }}
        className="relative space-y-8"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="job-company"
              className="text-xs font-semibold uppercase tracking-wider text-ink-muted"
            >
              Company <span className="text-red-600/90">*</span>
            </label>
            <input
              id="job-company"
              type="text"
              name="company"
              placeholder="e.g. Meridian Labs"
              required
              autoComplete="organization"
              className="input-modern"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="job-role"
              className="text-xs font-semibold uppercase tracking-wider text-ink-muted"
            >
              Role <span className="text-red-600/90">*</span>
            </label>
            <input
              id="job-role"
              type="text"
              name="role"
              placeholder="e.g. Product Engineer"
              required
              autoComplete="organization-title"
              className="input-modern"
            />
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Pipeline stage
          </span>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Application status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <label key={opt.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={opt.value}
                  defaultChecked={opt.value === 'applied'}
                  className="peer sr-only"
                />
                <span className="inline-flex items-center rounded-full border border-ink/12 bg-surface-muted/40 px-4 py-2 text-sm font-medium text-ink-muted transition-all duration-200 peer-checked:border-gold peer-checked:bg-gold/12 peer-checked:text-ink peer-checked:shadow-[0_0_0_1px_rgba(212,175,55,0.35)] peer-focus-visible:ring-2 peer-focus-visible:ring-gold/40">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-5 sm:gap-8">
          <div className="space-y-2 sm:col-span-2">
            <label
              htmlFor="job-date"
              className="text-xs font-semibold uppercase tracking-wider text-ink-muted"
            >
              Applied on
            </label>
            <input
              id="job-date"
              type="date"
              name="appliedDate"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="input-modern"
            />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <label
              htmlFor="job-notes"
              className="text-xs font-semibold uppercase tracking-wider text-ink-muted"
            >
              Notes
            </label>
            <textarea
              id="job-notes"
              name="notes"
              placeholder="Recruiter, links, follow-ups, interview prep…"
              rows={3}
              className="input-modern min-h-22 resize-y"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gold/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">
            Submissions save instantly to your register.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="btn-primary-gold disabled:pointer-events-none disabled:opacity-60"
          >
            {pending ? 'Saving…' : 'Add to register'}
          </button>
        </div>
      </form>
    </div>
  )
}
