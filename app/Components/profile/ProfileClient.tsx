'use client'

import { useState, useTransition } from 'react'
import { saveProfile } from '../../actions/profile'

interface GitHubRepo {
  name: string
  description: string | null
  language: string | null
  stargazers_count: number
}

interface ProfileData {
  fullName: string
  email: string
  phone: string
  location: string
  websiteUrl: string
  portfolioUrl: string
  githubUsername: string
  linkedinText: string
  skills: string[]
  githubData: GitHubRepo[]
}

interface ProfileClientProps {
  profile: ProfileData | null
}

// ── Shared input/label primitives ──────────────────────────────────────────
const inputClasses =
  'h-10 w-full border border-rule bg-paper px-3 font-sans text-sm text-ink outline-none placeholder:text-rule transition-colors focus:border-ink'

const labelClasses =
  'mb-1.5 block font-mono text-[10px] tracking-widest uppercase text-ink-mid'

// ── Section divider ────────────────────────────────────────────────────────
function SectionHeader({ title, note }: { title: string; note?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-rule pb-2">
      <span className="font-mono text-[10px] tracking-widest uppercase text-ink-mid">
        {title}
      </span>
      {note && (
        <span className="font-mono text-[10px] text-rule">{note}</span>
      )}
    </div>
  )
}

export default function ProfileClient({ profile }: ProfileClientProps) {
  const [fullName,       setFullName]       = useState(profile?.fullName       ?? '')
  const [email,          setEmail]          = useState(profile?.email          ?? '')
  const [phone,          setPhone]          = useState(profile?.phone          ?? '')
  const [location,       setLocation]       = useState(profile?.location       ?? '')
  const [websiteUrl,     setWebsiteUrl]     = useState(profile?.websiteUrl     ?? '')
  const [portfolioUrl,   setPortfolioUrl]   = useState(profile?.portfolioUrl   ?? '')
  const [githubUsername, setGithubUsername] = useState(profile?.githubUsername ?? '')
  const [linkedinText,   setLinkedinText]   = useState(profile?.linkedinText   ?? '')
  const [skills,         setSkills]         = useState<string[]>(profile?.skills    ?? [])
  const [githubData,     setGithubData]     = useState<GitHubRepo[]>(profile?.githubData ?? [])
  const [isPending, startTransition] = useTransition()
  const [error,  setError]  = useState<string | null>(null)
  const [saved,  setSaved]  = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('fullName',       fullName)
        formData.set('email',          email)
        formData.set('phone',          phone)
        formData.set('location',       location)
        formData.set('websiteUrl',     websiteUrl)
        formData.set('portfolioUrl',   portfolioUrl)
        formData.set('githubUsername', githubUsername)
        formData.set('linkedinText',   linkedinText)

        const result = await saveProfile(formData)
        if (result?.skills)     setSkills(result.skills)
        if (result?.githubData) setGithubData(result.githubData as GitHubRepo[])
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save profile')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">

      {/* ── Contact info ── */}
      <section className="space-y-4">
        <SectionHeader title="Contact info" note="Appears on your resume header" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fullName" className={labelClasses}>Full name</label>
            <input
              id="fullName" type="text" placeholder="Jane Doe"
              value={fullName} onChange={(e) => setFullName(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClasses}>Email</label>
            <input
              id="email" type="email" placeholder="jane@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClasses}>Phone</label>
            <input
              id="phone" type="tel" placeholder="(555) 123-4567"
              value={phone} onChange={(e) => setPhone(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="location" className={labelClasses}>Location</label>
            <input
              id="location" type="text" placeholder="San Francisco, CA"
              value={location} onChange={(e) => setLocation(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="websiteUrl" className={labelClasses}>Website / LinkedIn URL</label>
            <input
              id="websiteUrl" type="url" placeholder="https://linkedin.com/in/janedoe"
              value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>
      </section>

      {/* ── Background ── */}
      <section className="space-y-4">
        <SectionHeader title="Your background" note="Powers AI generation" />
        <div>
          <label htmlFor="portfolioUrl" className={labelClasses}>Portfolio URL</label>
          <input
            id="portfolioUrl" type="url" placeholder="https://yourportfolio.com"
            value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="githubUsername" className={labelClasses}>GitHub username</label>
          <input
            id="githubUsername" type="text" placeholder="octocat"
            value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="linkedinText" className={labelClasses}>
            LinkedIn about + experience
          </label>
          <p className="mb-1.5 font-mono text-[10px] text-rule">
            Paste your LinkedIn summary, experience, and education sections
          </p>
          <textarea
            id="linkedinText" rows={6}
            value={linkedinText} onChange={(e) => setLinkedinText(e.target.value)}
            className="w-full resize-none border border-rule bg-paper px-3 py-2.5 font-sans text-sm leading-relaxed text-ink outline-none placeholder:text-rule transition-colors focus:border-ink"
          />
        </div>
      </section>

      {/* ── Error ── */}
      {error && (
        <div className="border-l-[3px] border-stamp-red bg-stamp-red/5 px-4 py-3">
          <p className="font-mono text-[11px] text-stamp-red">{error}</p>
        </div>
      )}

      {/* ── Save ── */}
      <div className="flex items-center gap-4 border-t border-rule pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="border border-stamp-red bg-stamp-red px-6 py-2.5 font-mono text-[10px] tracking-widest uppercase text-paper transition-colors hover:bg-stamp-red/90 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save profile'}
        </button>
        {saved && (
          <span className="font-mono text-[11px] text-ink-mid">
            Saved. Extracting data...
          </span>
        )}
      </div>

      {/* ── Extracted skills ── */}
      {skills.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="Extracted skills" note={`${skills.length} detected`} />
          <p className="font-mono text-xs leading-relaxed text-ink-mid">
            {skills.join('  ·  ')}
          </p>
        </section>
      )}

      {/* ── GitHub repos — rendered as ledger rows ── */}
      {githubData.length > 0 && (
        <section className="space-y-0">
          <SectionHeader title="GitHub repos" note={`${githubData.length} imported`} />
          {githubData.map((repo) => (
            <div
              key={repo.name}
              className="ledger-row flex items-start justify-between gap-4 border-b border-rule px-0 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{repo.name}</p>
                {repo.description && (
                  <p className="mt-0.5 line-clamp-1 font-mono text-[11px] text-ink-mid">
                    {repo.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-4">
                {repo.language && (
                  <span className="font-mono text-[11px] text-ink-mid">{repo.language}</span>
                )}
                {repo.stargazers_count > 0 && (
                  <span className="font-mono text-[11px] text-rule tabular-nums">
                    {repo.stargazers_count}★
                  </span>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

    </form>
  )
}
