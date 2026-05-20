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
    <svg className="animate-spin w-5 h-5 text-paper" fill="none" viewBox="0 0 24 24">
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
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-10">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-4 inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-ink-mid transition-colors hover:text-ink"
        >
          ← DASHBOARD
        </button>
        <h1 className="font-display text-3xl font-light italic text-ink mt-2">New Application</h1>
        <p className="font-mono text-[11px] text-ink-mid mt-1">
          Paste a job URL or description to generate a tailored resume
        </p>
      </div>

      {!hasProfile && (
        <div className="border-l-[3px] border-stamp-gold bg-stamp-gold/5 px-4 py-3 mb-6">
          <p className="font-mono text-[11px] text-stamp-gold">
            <span className="font-semibold">Profile required.</span>{' '}
            <button
              onClick={() => router.push('/profile')}
              className="underline underline-offset-2 transition-colors hover:opacity-80"
            >
              Complete your profile
            </button>{' '}
            before generating documents.
          </p>
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
              className="w-full min-h-[180px] border border-rule bg-paper px-3 py-2.5 font-sans text-sm text-ink placeholder:text-rule resize-none outline-none leading-relaxed focus:border-ink"
            />

            {error && (
              <div className="border-l-[3px] border-stamp-red bg-stamp-red/5 px-4 py-3 font-mono text-[11px] text-stamp-red mt-3">
                {error}
              </div>
            )}

            <button
              onClick={() => void handleInputNext()}
              disabled={scraping || !input.trim()}
              className="mt-4 flex w-full items-center justify-center gap-2 bg-stamp-red py-3 font-mono text-[10px] tracking-widest uppercase text-paper transition-colors hover:bg-stamp-red/90 disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="space-y-4">
              <p className="font-mono text-[11px] text-ink-mid mb-4">
                Confirm these details before generating.
              </p>

              <div>
                <label className="mb-1.5 block font-mono text-[10px] tracking-widest uppercase text-ink-mid">
                  Company
                </label>
                <input
                  type="text"
                  value={extracted.company}
                  onChange={(e) => setExtracted((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder="e.g. Acme Corp"
                  className="h-10 w-full border border-rule bg-paper px-3 font-sans text-sm text-ink placeholder:text-rule outline-none transition-colors focus:border-ink"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[10px] tracking-widest uppercase text-ink-mid">
                  Role
                </label>
                <input
                  type="text"
                  value={extracted.role}
                  onChange={(e) => setExtracted((prev) => ({ ...prev, role: e.target.value }))}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="h-10 w-full border border-rule bg-paper px-3 font-sans text-sm text-ink placeholder:text-rule outline-none transition-colors focus:border-ink"
                />
              </div>

              {jobDescription && (
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] tracking-widest uppercase text-ink-mid">
                    Job description preview
                  </label>
                  <div className="max-h-28 overflow-y-auto border border-rule bg-paper-alt p-3 font-sans text-xs leading-relaxed text-ink-mid">
                    {jobDescription.slice(0, 400)}...
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="border-l-[3px] border-stamp-red bg-stamp-red/5 px-4 py-3 font-mono text-[11px] text-stamp-red mt-3">
                {error}
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => { setStep('input'); setError('') }}
                className="flex flex-1 items-center justify-center border border-rule py-2.5 px-6 font-mono text-[10px] tracking-widest uppercase text-ink-mid transition-colors hover:bg-paper-alt"
              >
                Back
              </button>
              <button
                onClick={() => void handleGenerate()}
                disabled={isPending || !extracted.company.trim() || !extracted.role.trim() || !hasProfile}
                className="flex flex-3 items-center justify-center gap-2 bg-stamp-red py-3 px-6 font-mono text-[10px] tracking-widest uppercase text-paper transition-colors hover:bg-stamp-red/90 disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="py-16 text-center">
              <p className="font-display text-2xl font-light italic text-ink mb-2">
                Generating your documents
              </p>
              <p className="font-mono text-[11px] text-ink-mid mb-8">
                {extracted.role} @ {extracted.company}
              </p>
              <div className="w-full space-y-3 text-left">
                {progressSteps.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: i <= progressStep ? 1 : 0.35, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="flex items-baseline gap-3"
                  >
                    <span className="font-mono text-[10px] text-rule">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={`font-sans text-sm ${
                        i < progressStep
                          ? 'text-ink-mid'
                          : i === progressStep
                          ? 'text-ink'
                          : 'text-rule'
                      }`}
                    >
                      {s.label}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-ink-mid">
                      {i < progressStep ? '✓' : i === progressStep ? '···' : ''}
                    </span>
                  </motion.div>
                ))}
              </div>
              <p className="mt-8 font-mono text-[10px] text-rule">This usually takes 15–30 seconds</p>
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
            <div className="border-l-[3px] border-stamp-gold bg-stamp-gold/5 px-4 py-4 mb-5">
              <p className="font-mono text-[11px] text-stamp-gold font-semibold">Documents generated!</p>
              <p className="font-sans text-sm text-ink-mid mt-0.5">
                Resume ready for {extracted.role} @ {extracted.company}
              </p>
            </div>

            {extractTopSkills(result.content).length > 0 && (
              <div className="border border-rule bg-paper-alt p-4 mb-5">
                <p className="font-mono text-[10px] tracking-widest uppercase text-ink-mid mb-3">
                  Skills highlighted
                </p>
                <div className="flex flex-wrap gap-2">
                  {extractTopSkills(result.content).map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex border border-stamp-blue/40 bg-stamp-blue/8 px-2 py-0.5 font-mono text-[10px] tracking-[0.1em] text-stamp-blue"
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
                className="w-full bg-stamp-red py-3 font-mono text-[10px] tracking-widest uppercase text-paper transition-colors hover:bg-stamp-red/90"
              >
                View & Download Documents
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full border border-rule py-2.5 font-mono text-[10px] tracking-widest uppercase text-ink-mid transition-colors hover:bg-paper-alt"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
