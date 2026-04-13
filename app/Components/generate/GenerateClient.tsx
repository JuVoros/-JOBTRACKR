'use client'

import { useState, useEffect, useTransition, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  generateResume,
  generateCoverLetter,
  scrapeJobPost,
} from '../../actions/generate'

type Tab = 'resume' | 'cover_letter'
type JdMode = 'paste' | 'url'

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

const RESUME_STEPS = ['Analyzing job requirements...', 'Matching your skills...', 'Writing your resume...']
const CL_STEPS = ['Analyzing job requirements...', 'Matching your skills...', 'Writing your cover letter...']

// Extract top 5 skills from the ## SKILLS section of markdown
function extractTopSkills(markdown: string): string[] {
  const match = markdown.match(/##\s+SKILLS\s*\n([\s\S]*?)(?=\n##|$)/i)
  if (!match) return []
  return match[1]
    .split(/[,·•|\n]/)
    .map((s) => s.trim().replace(/\*\*/g, ''))
    .filter(Boolean)
    .slice(0, 5)
}

// ── Generation progress (bottom sheet on mobile, overlay on desktop) ──────────
function GenerationProgress({
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
          {/* Mobile: bottom sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-white/5 bg-[#1a1a1e] p-6 pb-10 lg:hidden"
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/10" />
            <p className="mb-5 text-xs font-medium uppercase tracking-wider text-[#52525b]">
              Generating
            </p>
            <div className="space-y-4">
              {steps.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: i <= step ? 1 : 0.25, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs ${
                      i < step
                        ? 'bg-[#97C459] text-white'
                        : i === step
                        ? 'bg-[#7F77DD] text-white'
                        : 'bg-white/5 text-[#52525b]'
                    }`}
                  >
                    {i < step ? '✓' : i === step ? '⟳' : '·'}
                  </div>
                  <span
                    className={`text-sm ${
                      i === step ? 'font-medium text-[#e4e4e7]' : i < step ? 'text-[#71717a]' : 'text-[#3f3f46]'
                    }`}
                  >
                    {s}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Desktop: inline progress block */}
          <motion.div
            key="inline"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="hidden rounded-2xl border border-white/5 bg-[#1a1a1e] px-6 py-12 text-center lg:block"
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-sm text-[#7F77DD]"
              >
                {steps[step]}
              </motion.p>
            </AnimatePresence>
            <div className="mx-auto mt-4 flex justify-center gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-6 rounded-full transition-colors duration-300 ${
                    i <= step ? 'bg-[#7F77DD]' : 'bg-white/5'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Mobile summary card (shown on small screens after generation) ─────────────
function MobileSummaryCard({
  company,
  role,
  skills,
  tab,
  onDownload,
  onSwitchTab,
  onViewFull,
  downloading,
  showFull,
  content,
}: {
  company: string
  role: string
  skills: string[]
  tab: Tab
  onDownload: () => void
  onSwitchTab: () => void
  onViewFull: () => void
  downloading: boolean
  showFull: boolean
  content: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 md:hidden"
    >
      {/* Card */}
      <div className="rounded-2xl border border-white/5 bg-[#1a1a1e] p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-[#e4e4e7]">{company}</p>
            <p className="text-xs text-[#71717a]">{role}</p>
          </div>
          <span className="rounded-full bg-[#3B6D1122] px-2.5 py-1 text-xs font-medium text-[#97C459]">
            {tab === 'resume' ? 'Resume' : 'Cover Letter'} ready
          </span>
        </div>

        {skills.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs text-[#52525b]">Top matched skills</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-[#534AB744] bg-[#534AB722] px-3 py-1 text-xs text-[#AFA9EC]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Primary CTA */}
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#7F77DD] text-base font-semibold text-white transition-colors hover:bg-[#938BF0] active:scale-[0.98] disabled:opacity-50"
        >
          {downloading ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </div>

      {/* Secondary actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onViewFull}
          className="flex h-11 items-center justify-center rounded-xl border border-white/5 bg-[#1a1a1e] text-sm text-[#a1a1aa] transition-colors hover:bg-white/5"
        >
          {showFull ? 'Hide text' : 'View full text'}
        </button>
        <button
          type="button"
          onClick={onSwitchTab}
          className="flex h-11 items-center justify-center rounded-xl border border-[#7F77DD]/20 bg-[#534AB722] text-sm font-medium text-[#AFA9EC] transition-colors hover:bg-[#534AB733]"
        >
          {tab === 'resume' ? 'Cover Letter' : 'Resume'}
        </button>
      </div>

      {/* Expanded full text */}
      <AnimatePresence>
        {showFull && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-2xl border border-white/5 bg-[#1a1a1e] p-4"
          >
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-[#d4d4d8]">
              {content}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
  const [jdMode, setJdMode] = useState<JdMode>('paste')
  const [jdText, setJdText] = useState('')
  const [jdUrl, setJdUrl] = useState('')
  const [content, setContent] = useState<Record<Tab, string>>({
    resume: existingDocs.find((d) => d.type === 'resume')?.content ?? '',
    cover_letter: existingDocs.find((d) => d.type === 'cover_letter')?.content ?? '',
  })
  const [isPending, startTransition] = useTransition()
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [scrapingUrl, setScrapingUrl] = useState(false)
  const [showFullText, setShowFullText] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const steps = tab === 'resume' ? RESUME_STEPS : CL_STEPS

  // Cycle loading steps
  useEffect(() => {
    if (!isPending) { setLoadingStep(0); return }
    if (loadingStep >= steps.length - 1) return
    const t = setTimeout(() => setLoadingStep((s) => Math.min(s + 1, steps.length - 1)), 1200)
    return () => clearTimeout(t)
  }, [isPending, loadingStep, steps.length])

  const getJobDescription = useCallback(async (): Promise<string> => {
    if (jdMode === 'paste') {
      if (!jdText.trim()) throw new Error('Please paste the job description first.')
      return jdText.trim()
    }
    if (!jdUrl.trim()) throw new Error('Please enter the job post URL.')
    setScrapingUrl(true)
    try {
      const text = await scrapeJobPost(jdUrl.trim())
      setJdText(text)
      return text
    } finally {
      setScrapingUrl(false)
    }
  }, [jdMode, jdText, jdUrl])

  const handleGenerate = () => {
    setError(null)
    setLoadingStep(0)
    setShowFullText(false)
    startTransition(async () => {
      try {
        const jd = await getJobDescription()
        const result =
          tab === 'resume'
            ? await generateResume(jobId, jd)
            : await generateCoverLetter(jobId, jd)
        setContent((prev) => ({ ...prev, [tab]: result }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Generation failed')
      }
    })
  }

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
        const err = await res.json().catch(() => ({ error: 'PDF generation failed' }))
        throw new Error(err.error || 'PDF generation failed')
      }
      // True file download — no print dialog ever
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

  const handleCopy = async () => {
    const text = content[tab]
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const switchTab = (t: Tab) => {
    setTab(t)
    setShowFullText(false)
  }

  const hasJd = jdMode === 'paste' ? jdText.trim().length > 0 : jdUrl.trim().length > 0
  const topSkills = content[tab] ? extractTopSkills(content[tab]) : []

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Job info */}
      <div className="rounded-2xl border border-white/5 bg-[#1a1a1e] p-4 sm:p-5">
        <p className="text-base font-semibold text-[#e4e4e7]">{company}</p>
        <p className="mt-0.5 text-sm text-[#71717a]">{role}</p>
      </div>

      {/* Job description input */}
      <div className="rounded-2xl border border-white/5 bg-[#1a1a1e] p-4 sm:p-6">
        <h2 className="mb-3 text-sm font-medium text-[#e4e4e7]">Job Description</h2>

        {/* JD mode toggle */}
        <div className="mb-4 flex gap-1 rounded-xl bg-[#0d0d0f] p-1">
          {(['paste', 'url'] as JdMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setJdMode(mode)}
              className={`relative flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                jdMode === mode ? 'text-[#e4e4e7]' : 'text-[#52525b] hover:text-[#a1a1aa]'
              }`}
            >
              {jdMode === mode && (
                <motion.div
                  layoutId="jdModeTab"
                  className="absolute inset-0 rounded-lg bg-white/5"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                {mode === 'paste' ? 'Paste JD' : 'Job URL'}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {jdMode === 'paste' ? (
            <motion.div key="paste" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <textarea
                ref={textareaRef}
                rows={7}
                placeholder="Paste the job description or drop the URL here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="min-h-[140px] w-full resize-none rounded-xl border border-white/5 bg-[#0d0d0f] px-4 py-3 text-sm leading-relaxed text-[#e4e4e7] placeholder-[#3f3f46] outline-none transition-colors focus:border-[#7F77DD]/40"
              />
            </motion.div>
          ) : (
            <motion.div key="url" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <input
                type="url"
                placeholder="https://jobs.company.com/role/12345"
                value={jdUrl}
                onChange={(e) => setJdUrl(e.target.value)}
                className="h-11 w-full rounded-xl border border-white/5 bg-[#0d0d0f] px-4 text-sm text-[#e4e4e7] placeholder-[#3f3f46] outline-none transition-colors focus:border-[#7F77DD]/40"
              />
              {scrapingUrl && (
                <p className="mt-2 text-xs text-[#7F77DD]">Fetching job post...</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs — full width, h-12 pill toggles */}
      <div className="flex gap-1.5 rounded-2xl border border-white/5 bg-[#1a1a1e] p-1.5">
        {(['resume', 'cover_letter'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className={`relative flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors sm:py-3 ${
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

      {/* Generate button */}
      <motion.button
        type="button"
        onClick={handleGenerate}
        disabled={isPending || !hasJd}
        whileTap={{ scale: 0.98 }}
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#7F77DD] text-base font-semibold text-white transition-colors hover:bg-[#938BF0] active:bg-[#7F77DD] disabled:opacity-50 sm:h-11 sm:rounded-full sm:text-sm"
      >
        {isPending
          ? 'Generating...'
          : content[tab]
          ? `Regenerate ${tab === 'resume' ? 'Resume' : 'Cover Letter'}`
          : `Analyze & Generate ${tab === 'resume' ? 'Resume' : 'Cover Letter'}`}
      </motion.button>

      {!hasJd && !isPending && (
        <p className="text-center text-xs text-[#3f3f46]">
          {jdMode === 'paste' ? 'Paste a job description above to get started' : 'Enter a job URL above to get started'}
        </p>
      )}

      {/* Error */}
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

      {/* Loading: bottom sheet mobile / inline desktop */}
      <GenerationProgress show={isPending} step={loadingStep} steps={steps} />

      {/* ── Output ── */}
      <AnimatePresence mode="wait">
        {content[tab] && !isPending && (
          <motion.div
            key={`${tab}-output`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Mobile summary card */}
            <MobileSummaryCard
              company={company}
              role={role}
              skills={topSkills}
              tab={tab}
              onDownload={handleDownloadPdf}
              onSwitchTab={() => switchTab(tab === 'resume' ? 'cover_letter' : 'resume')}
              onViewFull={() => setShowFullText((v) => !v)}
              downloading={downloading}
              showFull={showFullText}
              content={content[tab]}
            />

            {/* Desktop output */}
            <div className="hidden md:block">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <motion.button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-9 rounded-full border border-[#7F77DD]/30 px-4 text-sm font-medium text-[#7F77DD] transition-colors hover:bg-[#7F77DD]/10 disabled:opacity-50"
                >
                  {downloading ? 'Generating PDF...' : 'Download PDF'}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleCopy}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-9 rounded-full border border-white/5 px-4 text-sm text-[#a1a1aa] transition-colors hover:bg-white/5"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </motion.button>
              </div>
              <div className="rounded-2xl border border-white/5 bg-[#1a1a1e] p-5 sm:p-6">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[#d4d4d8]">
                  {content[tab]}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!content[tab] && !isPending && hasJd && (
        <div className="rounded-2xl border border-white/5 bg-[#1a1a1e] px-6 py-12 text-center">
          <p className="text-sm text-[#52525b]">
            Click Generate to create a tailored {tab === 'resume' ? 'resume' : 'cover letter'}.
          </p>
        </div>
      )}
    </motion.div>
  )
}
