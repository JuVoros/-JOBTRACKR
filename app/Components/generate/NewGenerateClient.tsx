'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { scrapeJobPost, extractJobDetails, createJobAndGenerate } from '../../actions/generate'

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'input' | 'confirm' | 'generating' | 'done'

interface ExtractedDetails {
  company: string
  role: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim()) || /^www\./i.test(value.trim())
}

function extractTopSkills(markdown: string, max = 5): string[] {
  const match = markdown.match(/##\s*SKILLS\s*\n([\s\S]*?)(?=\n##|$)/i)
  if (!match) return []
  const raw = match[1].replace(/^[-*]\s*/gm, '').trim()
  return raw
    .split(/[,·•|]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'input', label: 'Job' },
    { key: 'confirm', label: 'Confirm' },
    { key: 'generating', label: 'Generate' },
  ]

  const stepIndex = (s: Step) => steps.findIndex((x) => x.key === s)
  const currentIdx = stepIndex(current === 'done' ? 'generating' : current)

  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((step, i) => {
        const done = i < currentIdx || current === 'done'
        const active = i === currentIdx && current !== 'done'
        return (
          <div key={step.key} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                done
                  ? 'bg-[#7F77DD] text-white'
                  : active
                  ? 'border-2 border-[#7F77DD] text-[#7F77DD]'
                  : 'border border-white/10 text-white/30'
              }`}
            >
              {done ? '✓' : i + 1}
            </div>
            <span
              className={`text-xs ${
                active ? 'text-white' : done ? 'text-[#7F77DD]' : 'text-white/30'
              }`}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`w-6 h-px mx-1 ${done ? 'bg-[#7F77DD]' : 'bg-white/10'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface NewGenerateClientProps {
  prefillUrl: string
  hasProfile: boolean
}

export default function NewGenerateClient({ prefillUrl, hasProfile }: NewGenerateClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [step, setStep] = useState<Step>('input')
  const [input, setInput] = useState(prefillUrl)
  const [jobDescription, setJobDescription] = useState('')
  const [scrapedText, setScrapedText] = useState('')
  const [extracted, setExtracted] = useState<ExtractedDetails>({ company: '', role: '' })
  const [error, setError] = useState('')
  const [scraping, setScraping] = useState(false)
  const [generatingMsg, setGeneratingMsg] = useState('Analyzing job description…')
  const [result, setResult] = useState<{ jobId: string; content: string } | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus textarea on mount
  useEffect(() => {
    if (!prefillUrl) {
      textareaRef.current?.focus()
    }
  }, [prefillUrl])

  // If prefilled URL arrives, immediately start scraping
  useEffect(() => {
    if (prefillUrl && looksLikeUrl(prefillUrl)) {
      void handleScrapeAndAdvance(prefillUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Step 1: handle paste / URL detection ──────────────────────────────────

  async function handleScrapeAndAdvance(url: string) {
    setScraping(true)
    setError('')
    try {
      const text = await scrapeJobPost(url)
      setScrapedText(text)
      setJobDescription(text)
      const details = await extractJobDetails(text)
      setExtracted(details)
      setStep('confirm')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to scrape job posting. Try pasting instead.')
    } finally {
      setScraping(false)
    }
  }

  async function handleInputNext() {
    setError('')
    const value = input.trim()
    if (!value) {
      setError('Please paste a job URL or job description.')
      return
    }

    if (looksLikeUrl(value)) {
      await handleScrapeAndAdvance(value)
    } else {
      // It's raw text
      const text = value
      setJobDescription(text)
      setScraping(true)
      try {
        const details = await extractJobDetails(text)
        setExtracted(details)
      } catch {
        // Non-fatal — user can fill in manually
      } finally {
        setScraping(false)
      }
      setStep('confirm')
    }
  }

  // ── Step 2: confirm details ───────────────────────────────────────────────

  async function handleGenerate() {
    if (!extracted.company.trim() || !extracted.role.trim()) {
      setError('Please fill in the company name and role.')
      return
    }
    if (!hasProfile) {
      setError('Please complete your profile before generating documents.')
      return
    }

    setError('')
    setStep('generating')

    const messages = [
      'Analyzing job description…',
      'Matching your skills to the role…',
      'Crafting tailored resume…',
      'Optimizing for ATS…',
      'Almost done…',
    ]
    let i = 0
    setGeneratingMsg(messages[0])
    const interval = setInterval(() => {
      i = Math.min(i + 1, messages.length - 1)
      setGeneratingMsg(messages[i])
    }, 3500)

    startTransition(async () => {
      try {
        const res = await createJobAndGenerate(
          extracted.company,
          extracted.role,
          jobDescription
        )
        clearInterval(interval)
        setResult(res)
        setStep('done')
      } catch (e) {
        clearInterval(interval)
        setError(e instanceof Error ? e.message : 'Generation failed. Please try again.')
        setStep('confirm')
      }
    })
  }

  // ── Step 4: done — navigate to job page ───────────────────────────────────

  function handleViewFull() {
    if (result) {
      router.push(`/generate/${result.jobId}`)
    }
  }

  function handleBackToDashboard() {
    router.push('/dashboard')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 pt-12 pb-32 md:pt-20">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBackToDashboard}
            className="text-sm text-white/40 hover:text-white/70 transition-colors mb-4 flex items-center gap-1"
          >
            ← Dashboard
          </button>
          <h1 className="text-2xl font-bold text-white">New Application</h1>
          <p className="text-sm text-white/50 mt-1">
            Paste a job URL or description to generate a tailored resume
          </p>
        </div>

        {/* No profile warning */}
        {!hasProfile && (
          <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-sm text-amber-300">
            <span className="font-semibold">Profile required.</span>{' '}
            <button
              onClick={() => router.push('/profile')}
              className="underline underline-offset-2 hover:text-amber-200 transition-colors"
            >
              Complete your profile
            </button>{' '}
            before generating documents.
          </div>
        )}

        <StepIndicator current={step} />

        <AnimatePresence mode="wait">

          {/* ── Step 1: Input ── */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <label className="block text-sm font-medium text-white/70 mb-3">
                  Job URL or description
                </label>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      void handleInputNext()
                    }
                  }}
                  placeholder="https://jobs.company.com/role/12345  — or paste the full job description here…"
                  className="w-full min-h-[160px] bg-transparent text-sm text-white placeholder:text-white/25 resize-none outline-none leading-relaxed"
                />
              </div>

              {error && (
                <p className="mt-3 text-sm text-red-400">{error}</p>
              )}

              <button
                onClick={() => void handleInputNext()}
                disabled={scraping || !input.trim()}
                className="mt-4 h-14 w-full rounded-2xl bg-[#7F77DD] hover:bg-[#6e66cc] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-base transition-all flex items-center justify-center gap-2"
              >
                {scraping ? (
                  <>
                    <SpinnerIcon />
                    Scraping job post…
                  </>
                ) : (
                  'Continue →'
                )}
              </button>

              <p className="mt-3 text-center text-xs text-white/30">
                ⌘ + Enter to continue
              </p>
            </motion.div>
          )}

          {/* ── Step 2: Confirm details ── */}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                <p className="text-sm text-white/50">
                  We extracted these details — confirm or edit before generating.
                </p>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wide">
                    Company
                  </label>
                  <input
                    type="text"
                    value={extracted.company}
                    onChange={(e) => setExtracted((prev) => ({ ...prev, company: e.target.value }))}
                    placeholder="e.g. Acme Corp"
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#7F77DD]/60 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wide">
                    Role
                  </label>
                  <input
                    type="text"
                    value={extracted.role}
                    onChange={(e) => setExtracted((prev) => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#7F77DD]/60 transition-colors"
                  />
                </div>

                {/* Show snippet of JD so user can verify */}
                {jobDescription && (
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wide">
                      Job description preview
                    </label>
                    <div className="rounded-xl border border-white/8 bg-black/20 p-3 text-xs text-white/40 leading-relaxed max-h-28 overflow-y-auto">
                      {jobDescription.slice(0, 400)}…
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <p className="mt-3 text-sm text-red-400">{error}</p>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => { setStep('input'); setError('') }}
                  className="h-11 flex-1 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm font-medium transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={() => void handleGenerate()}
                  disabled={isPending || !extracted.company.trim() || !extracted.role.trim() || !hasProfile}
                  className="h-14 flex-[3] rounded-2xl bg-[#7F77DD] hover:bg-[#6e66cc] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-base transition-all flex items-center justify-center gap-2"
                >
                  Generate Resume + Cover Letter
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Generating ── */}
          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              {/* Animated ring */}
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-full border-2 border-white/10" />
                <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-t-[#7F77DD] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">✨</div>
              </div>

              <motion.p
                key={generatingMsg}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="text-white font-medium text-lg mb-2"
              >
                {generatingMsg}
              </motion.p>

              <p className="text-sm text-white/40">
                Generating for{' '}
                <span className="text-white/70">
                  {extracted.role} @ {extracted.company}
                </span>
              </p>

              <p className="text-xs text-white/25 mt-6">
                This usually takes 15–30 seconds
              </p>
            </motion.div>
          )}

          {/* ── Step 4: Done ── */}
          {step === 'done' && result && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Success banner */}
              <div className="mb-5 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 flex items-start gap-3">
                <span className="text-green-400 text-xl mt-0.5">✓</span>
                <div>
                  <p className="text-sm font-semibold text-green-300">Documents generated!</p>
                  <p className="text-xs text-green-400/70 mt-0.5">
                    Resume and cover letter ready for {extracted.role} @ {extracted.company}
                  </p>
                </div>
              </div>

              {/* Skill pills preview */}
              {extractTopSkills(result.content).length > 0 && (
                <div className="mb-5 rounded-xl border border-white/8 bg-white/5 p-4">
                  <p className="text-xs text-white/40 mb-3 uppercase tracking-wide font-medium">
                    Skills highlighted
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {extractTopSkills(result.content).map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 rounded-full border border-[#7F77DD]/40 bg-[#7F77DD]/10 text-xs text-[#a09aee]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleViewFull}
                  className="h-14 w-full rounded-2xl bg-[#7F77DD] hover:bg-[#6e66cc] text-white font-semibold text-base transition-all"
                >
                  View & Download Documents
                </button>
                <button
                  onClick={handleBackToDashboard}
                  className="h-11 w-full rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm font-medium transition-all"
                >
                  Back to Dashboard
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
