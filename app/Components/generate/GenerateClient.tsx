'use client'

import { useState, useEffect, useTransition, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  generateResume,
  generateCoverLetter,
  scrapeJobPost,
} from '../../actions/generate'

type Tab = 'resume' | 'cover_letter'

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

function getDomain(url: string): string {
  try {
    const u = new URL(url.trim())
    return u.hostname.replace(/^www\./i, '')
  } catch {
    return url.trim().slice(0, 40)
  }
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

function LinkIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.72" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.72-1.72" />
    </svg>
  )
}

// ── Loading progress (bottom sheet on mobile, inline on desktop) ──────────────

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
  const [tab, setTab] = useState<Tab>('resume')
  const [input, setInput] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [content, setContent] = useState<Record<Tab, string>>({
    resume: existingDocs.find((d) => d.type === 'resume')?.content ?? '',
    cover_letter: existingDocs.find((d) => d.type === 'cover_letter')?.content ?? '',
  })
  const [isPending, startTransition] = useTransition()
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
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
      setSourceUrl(trimmed)
      try {
        const text = await scrapeJobPost(trimmed)
        return text
      } finally {
        setScraping(false)
      }
    }

    setSourceUrl('')
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

  const handleCopy = useCallback(async () => {
    const text = content[tab]
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [content, tab])

  const hasInput = input.trim().length > 0
  const currentContent = content[tab]
  const hasAnyContent = !!content.resume || !!content.cover_letter
  const domain = useMemo(() => (sourceUrl ? getDomain(sourceUrl) : null), [sourceUrl])

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

  // ── Shared subcomponents ────────────────────────────────────────────────────

  const JobMeta = (
    <div className="rounded-2xl border border-white/5 bg-[#1a1a1e] p-4 sm:p-5">
      <p className="truncate text-base font-semibold text-[#e4e4e7]">{company}</p>
      <p className="truncate text-sm text-[#71717a]">{role}</p>
      {domain && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-2 inline-flex max-w-full items-center gap-1 overflow-hidden text-xs text-[#7F77DD] hover:text-[#938BF0]"
          title={sourceUrl}
        >
          <LinkIcon />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{domain}</span>
        </a>
      )}
    </div>
  )

  const InputCard = (
    <div className="rounded-2xl border border-white/5 bg-[#1a1a1e] p-4 sm:p-5">
      <label className="mb-2 block text-sm font-medium text-[#e4e4e7]">Job description</label>
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
  )

  const Tabs = (
    <div className="flex gap-1.5 rounded-2xl border border-white/5 bg-[#1a1a1e] p-1.5">
      {(['resume', 'cover_letter'] as Tab[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTab(t)}
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

  const GenerateButton = (
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
          {currentContent
            ? `Regenerate ${tab === 'resume' ? 'Resume' : 'Cover Letter'}`
            : `Generate ${tab === 'resume' ? 'Resume' : 'Cover Letter'}`}
        </>
      )}
    </motion.button>
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full"
    >
      {/* ── Desktop: two-column layout ── */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Left: input + controls */}
        <div className="space-y-5">
          {JobMeta}
          {InputCard}
          {Tabs}
          {GenerateButton}
          {ErrorBanner}
        </div>

        {/* Right: preview */}
        <div className="space-y-4">
          {isPending ? (
            <div className="rounded-2xl border border-white/5 bg-[#1a1a1e] px-6 py-10">
              <div className="space-y-4">
                {steps.map((s, i) => (
                  <ProgressStep key={i} state={stateFor(i, loadingStep)} label={s} />
                ))}
              </div>
            </div>
          ) : currentContent ? (
            <>
              <div className="rounded-2xl border border-white/5 bg-[#1a1a1e] p-5">
                <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-[#d4d4d8]">
                  {currentContent}
                </pre>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#7F77DD] text-base font-semibold text-white transition-colors hover:bg-[#938BF0] disabled:opacity-50"
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
                  onClick={handleCopy}
                  className="h-14 rounded-2xl border border-white/5 px-5 text-sm font-medium text-[#a1a1aa] transition-colors hover:bg-white/5 hover:text-[#e4e4e7]"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-white/5 bg-[#1a1a1e] px-6 py-12 text-center">
              <p className="text-sm text-[#52525b]">
                Paste a job description and generate to preview here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile: single-column step flow ── */}
      <div className="space-y-5 lg:hidden">
        {JobMeta}
        {InputCard}
        {hasAnyContent && Tabs}
        {GenerateButton}
        {ErrorBanner}

        <AnimatePresence mode="wait">
          {currentContent && !isPending && (
            <motion.div
              key={`${tab}-out-mobile`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="rounded-2xl border border-white/5 bg-[#1a1a1e] p-4">
                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-[#d4d4d8]">
                  {currentContent}
                </pre>
              </div>

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

              <button
                type="button"
                onClick={handleCopy}
                className="h-11 w-full rounded-xl border border-white/5 text-sm text-[#a1a1aa] transition-colors hover:bg-white/5 hover:text-[#e4e4e7]"
              >
                {copied ? 'Copied' : 'Copy text'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!currentContent && !isPending && !hasInput && (
          <div className="rounded-2xl border border-dashed border-white/5 bg-[#1a1a1e] px-6 py-10 text-center">
            <p className="text-sm text-[#52525b]">
              Paste a job description or URL above to get started.
            </p>
          </div>
        )}

        <MobileProgressSheet show={isPending} step={loadingStep} steps={steps} />
      </div>
    </motion.div>
  )
}
