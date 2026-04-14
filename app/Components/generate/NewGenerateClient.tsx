'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { scrapeJobPost, extractJobDetails, createJobAndGenerate } from '../../actions/generate'

type Step = 'input' | 'confirm' | 'generating' | 'done'

interface ExtractedDetails {
  company: string
  role: string
}

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

function SparkleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

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
  const [extracted, setExtracted] = useState<ExtractedDetails>({ company: '', role: '' })
  const [error, setError] = useState('')
  const [scraping, setScraping] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [result, setResult] = useState<{ jobId: string; content: string } | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!prefillUrl) textareaRef.current?.focus()
  }, [prefillUrl])

  useEffect(() => {
    if (prefillUrl && looksLikeUrl(prefillUrl)) {
      void handleScrapeAndAdvance(prefillUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleScrapeAndAdvance(url: string) {
    setScraping(true)
    setError('')
    try {
      const text = await scrapeJobPost(url)
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
      setJobDescription(value)
      setScraping(true)
      try {
        const details = await extractJobDetails(value)
        setExtracted(details)
      } catch {
        // Non-fatal
      } finally {
        setScraping(false)
      }
      setStep('confirm')
    }
  }

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
    setProgressStep(0)

    const progressMessages = [
      { delay: 0 },
      { delay: 2500 },
      { delay: 5500 },
    ]
    const timers: NodeJS.Timeout[] = []
    progressMessages.forEach((msg, i) => {
      if (i > 0) {
        timers.push(setTimeout(() => setProgressStep(i), msg.delay))
      }
    })

    startTransition(async () => {
      try {
        const res = await createJobAndGenerate(extracted.company, extracted.role, jobDescription)
        timers.forEach(clearTimeout)
        setResult(res)
        setStep('done')
      } catch (e) {
        timers.forEach(clearTimeout)
        setError(e instanceof Error ? e.message : 'Generation failed. Please try again.')
        setStep('confirm')
      }
    })
  }

  function handleViewFull() {
    if (result) router.push(`/generate/${result.jobId}`)
  }

  const progressSteps = [
    { label: 'Job analyzed', icon: '✓' },
    { label: 'Skills matched', icon: '✓' },
    { label: 'Writing your resume...', icon: '⟳' },
  ]

  return (
    <div className="flex min-h-screen flex-col items-center justify-start px-4 pb-32 pt-12 md:pt-20">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-4 flex items-center gap-1 text-sm text-white/40 transition-colors hover:text-white/70"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Dashboard
          </button>
          <h1 className="text-2xl font-bold text-white">New Application</h1>
          <p className="mt-1 text-sm text-white/50">
            Paste a job URL or description to generate a tailored resume
          </p>
        </div>

        {!hasProfile && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
            <span className="font-semibold">Profile required.</span>{' '}
            <button
              onClick={() => router.push('/profile')}
              className="underline underline-offset-2 transition-colors hover:text-amber-200"
            >
              Complete your profile
            </button>{' '}
            before generating documents.
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Input */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
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
                  placeholder="Paste job description or drop a URL..."
                  className="w-full min-h-[180px] bg-transparent text-sm text-white placeholder:text-white/25 resize-none outline-none leading-relaxed"
                />
              </div>

              {error && (
                <p className="mt-3 text-sm text-red-400">{error}</p>
              )}

              <button
                onClick={() => void handleInputNext()}
                disabled={scraping || !input.trim()}
                className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#7F77DD] text-base font-semibold text-white transition-all hover:bg-[#6e66cc] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {scraping ? (
                  <>
                    <SpinnerIcon />
                    Scraping job post...
                  </>
                ) : (
                  <>
                    <SparkleIcon className="w-5 h-5" />
                    Generate
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Step 2: Confirm details */}
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
                  Confirm these details before generating.
                </p>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50">
                    Company
                  </label>
                  <input
                    type="text"
                    value={extracted.company}
                    onChange={(e) => setExtracted((prev) => ({ ...prev, company: e.target.value }))}
                    placeholder="e.g. Acme Corp"
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#7F77DD]/60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50">
                    Role
                  </label>
                  <input
                    type="text"
                    value={extracted.role}
                    onChange={(e) => setExtracted((prev) => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#7F77DD]/60"
                  />
                </div>

                {jobDescription && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50">
                      Job description preview
                    </label>
                    <div className="max-h-28 overflow-y-auto rounded-xl border border-white/5 bg-black/20 p-3 text-xs leading-relaxed text-white/40">
                      {jobDescription.slice(0, 400)}...
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
                  className="flex h-11 flex-1 items-center justify-center rounded-xl border border-white/10 text-sm font-medium text-white/60 transition-all hover:border-white/20 hover:text-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back
                </button>
                <button
                  onClick={() => void handleGenerate()}
                  disabled={isPending || !extracted.company.trim() || !extracted.role.trim() || !hasProfile}
                  className="flex h-14 flex-3 items-center justify-center gap-2 rounded-2xl bg-[#7F77DD] text-base font-semibold text-white transition-all hover:bg-[#6e66cc] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <SparkleIcon className="w-5 h-5" />
                  Generate Resume + Cover Letter
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Generating */}
          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
            >
              {/* Desktop: centered progress */}
              <div className="hidden flex-col items-center justify-center py-16 text-center lg:flex">
                <div className="relative mb-8">
                  <div className="h-20 w-20 rounded-full border-2 border-white/10" />
                  <div className="absolute inset-0 h-20 w-20 animate-spin rounded-full border-2 border-t-[#7F77DD]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <SparkleIcon className="w-8 h-8 text-[#7F77DD]" />
                  </div>
                </div>
                <p className="mb-2 text-lg font-medium text-white">
                  {progressSteps[Math.min(progressStep, progressSteps.length - 1)].label}
                </p>
                <p className="text-sm text-white/40">
                  Generating for{' '}
                  <span className="text-white/70">{extracted.role} @ {extracted.company}</span>
                </p>
                <p className="mt-6 text-xs text-white/25">This usually takes 15–30 seconds</p>
              </div>

              {/* Mobile: bottom sheet progress */}
              <div className="flex flex-col items-center justify-center py-20 text-center lg:hidden">
                <div className="relative mb-6">
                  <div className="h-16 w-16 rounded-full border-2 border-white/10" />
                  <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-2 border-t-[#7F77DD]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <SparkleIcon className="w-6 h-6 text-[#7F77DD]" />
                  </div>
                </div>
                <p className="mb-6 text-sm text-white/40">
                  {extracted.role} @ {extracted.company}
                </p>
                <div className="w-full space-y-3">
                  {progressSteps.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: i <= progressStep ? 1 : 0.25, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                          i < progressStep
                            ? 'bg-[#97C459] text-white'
                            : i === progressStep
                            ? 'bg-[#7F77DD] text-white'
                            : 'bg-white/5 text-[#52525b]'
                        }`}
                      >
                        {i < progressStep ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : i === progressStep ? (
                          <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          '·'
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          i === progressStep ? 'font-medium text-[#e4e4e7]' : i < progressStep ? 'text-[#71717a]' : 'text-[#3f3f46]'
                        }`}
                      >
                        {s.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Done */}
          {step === 'done' && result && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500/30 text-green-300">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-green-300">Documents generated!</p>
                  <p className="mt-0.5 text-xs text-green-400/70">
                    Resume ready for {extracted.role} @ {extracted.company}
                  </p>
                </div>
              </div>

              {extractTopSkills(result.content).length > 0 && (
                <div className="mb-5 rounded-xl border border-white/5 bg-white/5 p-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-white/40">
                    Skills highlighted
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {extractTopSkills(result.content).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-[#7F77DD]/40 bg-[#7F77DD]/10 px-2.5 py-1 text-xs text-[#a09aee]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleViewFull}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#7F77DD] text-base font-semibold text-white transition-all hover:bg-[#6e66cc]"
                >
                  View & Download Documents
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex h-11 w-full items-center justify-center rounded-xl border border-white/10 text-sm font-medium text-white/60 transition-all hover:border-white/20 hover:text-white"
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
