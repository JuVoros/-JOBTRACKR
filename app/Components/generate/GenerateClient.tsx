'use client'

import { useState, useEffect, useTransition, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  generateResume,
  generateCoverLetter,
  scrapeJobPost,
} from '../../actions/generate'

type Tab = 'resume' | 'cover_letter'
type View = 'input' | 'result'

interface ExistingDoc {
  id: string
  type: string
  content: string
  createdAt: string
}

interface ContactInfo {
  fullName?: string
  email?: string
  phone?: string
  location?: string
  websiteUrl?: string
}

interface GenerateClientProps {
  jobId: string
  company: string
  role: string
  existingDocs: ExistingDoc[]
  hasProfile: boolean
  contactInfo: ContactInfo
}

const RESUME_STEPS = ['Job analyzed', 'Skills matched', 'Writing your resume...']
const CL_STEPS = ['Job analyzed', 'Skills matched', 'Writing your cover letter...']

// ── Helpers ────────────────────────────────────────────────────────────────────

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function SparkleIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
    </svg>
  )
}

function SpinnerIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ── Loading progress ──────────────────────────────────────────────────────────

function ProgressStep({
  state,
  label,
}: {
  state: 'done' | 'active' | 'pending'
  label: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs ${
          state === 'done'
            ? 'bg-[#97C459] text-white'
            : state === 'active'
            ? 'bg-[#7F77DD] text-white'
            : 'bg-white/5 text-[#52525b]'
        }`}
      >
        {state === 'done' ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : state === 'active' ? (
          <SpinnerIcon size={12} />
        ) : (
          '·'
        )}
      </div>
      <span
        className={`text-sm ${
          state === 'active'
            ? 'font-medium text-[#e4e4e7]'
            : state === 'done'
            ? 'text-[#71717a]'
            : 'text-[#3f3f46]'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

function stateFor(i: number, current: number): 'done' | 'active' | 'pending' {
  if (i < current) return 'done'
  if (i === current) return 'active'
  return 'pending'
}

function MobileProgressSheet({
  show,
  step,
  steps,
}: {
  show: boolean
  step: number
  steps: string[]
}) {
  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-white/5 bg-[#1a1a1e] px-6 pt-4 lg:hidden"
            style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/10" />
            <p className="mb-5 text-xs font-medium uppercase tracking-wider text-[#52525b]">
              Generating
            </p>
            <div className="space-y-4">
              {steps.map((s, i) => (
                <ProgressStep key={i} state={stateFor(i, step)} label={s} />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GenerateClient({
  jobId,
  company,
  role,
  existingDocs,
  hasProfile,
  contactInfo,
}: GenerateClientProps) {
  const initialContent = useMemo<Record<Tab, string>>(
    () => ({
      resume: existingDocs.find((d) => d.type === 'resume')?.content ?? '',
      cover_letter: existingDocs.find((d) => d.type === 'cover_letter')?.content ?? '',
    }),
    [existingDocs]
  )

  const [tab, setTab] = useState<Tab>('resume')
  const [input, setInput] = useState('')
  const [content, setContent] = useState<Record<Tab, string>>(initialContent)
  const [view, setView] = useState<View>(
    initialContent.resume || initialContent.cover_letter ? 'result' : 'input'
  )
  const [isPending, startTransition] = useTransition()
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [scraping, setScraping] = useState(false)

  const steps = tab === 'resume' ? RESUME_STEPS : CL_STEPS

  // Advance loading steps every 1.2s while generating
  useEffect(() => {
    if (!isPending) {
      setLoadingStep(0)
      return
    }
    if (loadingStep >= steps.length - 1) return
    const t = setTimeout(
      () => setLoadingStep((s) => Math.min(s + 1, steps.length - 1)),
      1200
    )
    return () => clearTimeout(t)
  }, [isPending, loadingStep, steps.length])

  const resolveJobDescription = useCallback(async (): Promise<string> => {
    const trimmed = input.trim()
    if (!trimmed) throw new Error('Paste a job description or URL first.')

    if (looksLikeUrl(trimmed)) {
      setScraping(true)
      try {
        const text = await scrapeJobPost(trimmed)
        return text
      } finally {
        setScraping(false)
      }
    }

    return trimmed
  }, [input])

  const handleGenerate = useCallback(() => {
    setError(null)
    setLoadingStep(0)
    startTransition(async () => {
      try {
        const jd = await resolveJobDescription()
        const result =
          tab === 'resume'
            ? await generateResume(jobId, jd)
            : await generateCoverLetter(jobId, jd)
        setContent((prev) => ({ ...prev, [tab]: result }))
        setView('result')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Generation failed')
      }
    })
  }, [tab, jobId, resolveJobDescription])

  const handleDownloadPdf = useCallback(async () => {
    const text = content[tab]
    if (!text) return
    setDownloading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, type: tab, company, role, contactInfo }),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'PDF generation failed' }))
        throw new Error(errJson.error || 'PDF generation failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const prefix = tab === 'cover_letter' ? 'cover-letter' : 'resume'
      a.href = url
      a.download = `${prefix}-${company.toLowerCase().replace(/\s+/g, '-')}-${role.toLowerCase().replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }, [content, tab, company, role, contactInfo])

  const handleSelectTab = useCallback(
    (next: Tab) => {
      setTab(next)
      // Keep result view if that tab has content; otherwise fall back to input view
      if (content[next]) setView('result')
      else setView('input')
    },
    [content]
  )

  const handleRegenerate = useCallback(() => {
    setError(null)
    setView('input')
  }, [])

  const hasInput = input.trim().length > 0
  const currentContent = content[tab]
  const tabLabel = tab === 'resume' ? 'Resume' : 'Cover Letter'

  if (!hasProfile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/5 bg-[#1a1a1e] px-6 py-16 text-center"
      >
        <p className="text-sm text-[#a1a1aa]">Complete your profile to generate documents.</p>
        <a
          href="/profile"
          className="mt-4 inline-flex h-11 items-center rounded-full bg-[#7F77DD] px-6 text-sm font-medium text-white transition-colors hover:bg-[#938BF0]"
        >
          Set Up Profile
        </a>
      </motion.div>
    )
  }

  // ── Shared UI fragments ────────────────────────────────────────────────────

  const Tabs = (
    <div className="flex gap-1.5 rounded-2xl border border-white/5 bg-[#1a1a1e] p-1.5">
      {(['resume', 'cover_letter'] as Tab[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => handleSelectTab(t)}
          className={`relative flex h-12 flex-1 items-center justify-center rounded-xl px-4 text-sm font-medium transition-colors ${
            tab === t ? 'text-[#e4e4e7]' : 'text-[#52525b] hover:text-[#a1a1aa]'
          }`}
        >
          {tab === t && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 rounded-xl bg-white/5"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{t === 'resume' ? 'Resume' : 'Cover Letter'}</span>
        </button>
      ))}
    </div>
  )

  const ErrorBanner = (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="rounded-xl border border-[#A32D2D44] bg-[#A32D2D22] px-4 py-3 text-sm text-[#F09595]"
        >
          {error}
        </motion.div>
      )}
    </AnimatePresence>
  )

  // ── Input view ─────────────────────────────────────────────────────────────

  const InputView = (
    <motion.div
      key="input-view"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="w-full space-y-5"
    >
      {/* Job meta header */}
      <div className="rounded-2xl border border-white/5 bg-[#1a1a1e] p-4 sm:p-5">
        <p className="truncate text-base font-semibold text-[#e4e4e7]">{company}</p>
        <p className="truncate text-sm text-[#71717a]">{role}</p>
      </div>

      {Tabs}

      {/* Input card */}
      <div className="rounded-2xl border border-white/5 bg-[#1a1a1e] p-4 sm:p-5">
        <label className="mb-2 block text-sm font-medium text-[#e4e4e7]">
          Job description
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          placeholder="Paste job description or drop a URL"
          className="min-h-[180px] w-full resize-none rounded-xl border border-white/5 bg-[#0d0d0f] px-4 py-3 text-base leading-relaxed text-[#e4e4e7] placeholder-[#3f3f46] outline-none transition-colors focus:border-[#7F77DD]/40 sm:text-sm"
        />
        {scraping && (
          <p className="mt-2 flex items-center gap-2 text-xs text-[#7F77DD]">
            <SpinnerIcon size={12} /> Fetching job post...
          </p>
        )}
      </div>

      <motion.button
        type="button"
        onClick={handleGenerate}
        disabled={isPending || !hasInput}
        whileTap={{ scale: 0.98 }}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#7F77DD] text-base font-semibold text-white transition-colors hover:bg-[#938BF0] disabled:opacity-50"
      >
        {isPending ? (
          <>
            <SpinnerIcon /> Generating...
          </>
        ) : (
          <>
            <SparkleIcon size={18} />
            {currentContent ? `Regenerate ${tabLabel}` : `Generate ${tabLabel}`}
          </>
        )}
      </motion.button>

      {ErrorBanner}

      {/* Desktop inline progress */}
      {isPending && (
        <div className="hidden rounded-2xl border border-white/5 bg-[#1a1a1e] px-6 py-6 lg:block">
          <div className="space-y-4">
            {steps.map((s, i) => (
              <ProgressStep key={i} state={stateFor(i, loadingStep)} label={s} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )

  // ── Result view ────────────────────────────────────────────────────────────

  const ResultView = (
    <motion.div
      key="result-view"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="w-full space-y-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0"
    >
      {/* Header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-[#52525b]">
          {tabLabel}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-[#e4e4e7] sm:text-2xl">
          {tabLabel} for {company}
        </h2>
      </div>

      {Tabs}

      {/* Content */}
      <div className="rounded-2xl border border-white/5 bg-[#1a1a1e] p-4 sm:p-6">
        <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-[#d4d4d8] lg:max-h-[62vh]">
          {currentContent}
        </pre>
      </div>

      {ErrorBanner}

      {/* Desktop inline actions */}
      <div className="hidden flex-col items-stretch gap-3 lg:flex">
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#7F77DD] text-base font-semibold text-white transition-colors hover:bg-[#938BF0] disabled:opacity-50"
        >
          {downloading ? (
            <>
              <SpinnerIcon /> Generating PDF...
            </>
          ) : (
            'Download PDF'
          )}
        </button>
        <button
          type="button"
          onClick={handleRegenerate}
          className="h-11 w-full text-sm font-medium text-[#a1a1aa] transition-colors hover:text-[#e4e4e7]"
        >
          Regenerate
        </button>
      </div>
    </motion.div>
  )

  // ── Mobile fixed download bar (only in result view) ───────────────────────

  const MobileDownloadBar = (
    <AnimatePresence>
      {view === 'result' && !!currentContent && !isPending && (
        <motion.div
          key="download-bar"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          className="fixed inset-x-0 bottom-16 z-30 border-t border-white/5 bg-[#0d0d0f]/95 px-4 pt-3 backdrop-blur-md lg:hidden"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={handleRegenerate}
            className="mx-auto mb-2 block h-8 text-xs font-medium text-[#a1a1aa] transition-colors hover:text-[#e4e4e7]"
          >
            Regenerate
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#7F77DD] text-base font-semibold text-white transition-colors hover:bg-[#938BF0] active:scale-[0.98] disabled:opacity-50"
          >
            {downloading ? (
              <>
                <SpinnerIcon /> Generating PDF...
              </>
            ) : (
              'Download PDF'
            )}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full"
    >
      <div className="mx-auto w-full max-w-2xl">
        <AnimatePresence mode="wait" initial={false}>
          {view === 'input' ? InputView : ResultView}
        </AnimatePresence>
      </div>

      {MobileDownloadBar}
      <MobileProgressSheet show={isPending} step={loadingStep} steps={steps} />
    </motion.div>
  )
}
