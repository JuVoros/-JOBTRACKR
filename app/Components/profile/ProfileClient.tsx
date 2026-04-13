'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
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

export default function ProfileClient({ profile }: ProfileClientProps) {
  const [fullName, setFullName] = useState(profile?.fullName ?? '')
  const [email, setEmail] = useState(profile?.email ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [location, setLocation] = useState(profile?.location ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(profile?.websiteUrl ?? '')
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolioUrl ?? '')
  const [githubUsername, setGithubUsername] = useState(profile?.githubUsername ?? '')
  const [linkedinText, setLinkedinText] = useState(profile?.linkedinText ?? '')
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? [])
  const [githubData, setGithubData] = useState<GitHubRepo[]>(profile?.githubData ?? [])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('fullName', fullName)
        formData.set('email', email)
        formData.set('phone', phone)
        formData.set('location', location)
        formData.set('websiteUrl', websiteUrl)
        formData.set('portfolioUrl', portfolioUrl)
        formData.set('githubUsername', githubUsername)
        formData.set('linkedinText', linkedinText)

        const result = await saveProfile(formData)
        if (result?.skills) setSkills(result.skills)
        if (result?.githubData) setGithubData(result.githubData as GitHubRepo[])
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save profile')
      }
    })
  }

  const inputClass =
    'h-10 w-full rounded-xl border border-white/5 bg-[#0d0d0f] px-3 text-sm text-[#e4e4e7] placeholder-[#52525b] outline-none transition-colors focus:border-[#7F77DD]/40'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact info card */}
        <div className="rounded-2xl border border-white/5 bg-[#1a1a1e] p-5 sm:p-6">
          <h2 className="mb-1 text-sm font-medium text-[#e4e4e7]">Contact Info</h2>
          <p className="mb-4 text-xs text-[#52525b]">Appears on your resume header</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm text-[#a1a1aa]">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm text-[#a1a1aa]">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm text-[#a1a1aa]">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="location" className="mb-1.5 block text-sm text-[#a1a1aa]">
                Location
              </label>
              <input
                id="location"
                type="text"
                placeholder="San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="websiteUrl" className="mb-1.5 block text-sm text-[#a1a1aa]">
                Website / LinkedIn URL
              </label>
              <input
                id="websiteUrl"
                type="url"
                placeholder="https://linkedin.com/in/janedoe"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Background card */}
        <div className="rounded-2xl border border-white/5 bg-[#1a1a1e] p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-medium text-[#e4e4e7]">Your Background</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="portfolioUrl" className="mb-1.5 block text-sm text-[#a1a1aa]">
                Portfolio URL
              </label>
              <input
                id="portfolioUrl"
                type="url"
                placeholder="https://yourportfolio.com"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="githubUsername" className="mb-1.5 block text-sm text-[#a1a1aa]">
                GitHub Username
              </label>
              <input
                id="githubUsername"
                type="text"
                placeholder="octocat"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="linkedinText" className="mb-1.5 block text-sm text-[#a1a1aa]">
                Paste your LinkedIn About + Experience
              </label>
              <textarea
                id="linkedinText"
                rows={6}
                placeholder="Copy and paste your LinkedIn summary, experience, and education..."
                value={linkedinText}
                onChange={(e) => setLinkedinText(e.target.value)}
                className="w-full resize-none rounded-xl border border-white/5 bg-[#0d0d0f] px-3 py-2.5 text-sm leading-relaxed text-[#e4e4e7] placeholder-[#52525b] outline-none transition-colors focus:border-[#7F77DD]/40"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-[#A32D2D44] bg-[#A32D2D22] px-3 py-2 text-sm text-[#F09595]">
              {error}
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="h-9 rounded-full bg-[#7F77DD] px-5 text-sm font-medium text-white transition-colors hover:bg-[#938BF0] disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save Profile'}
            </button>

            {saved && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-[#97C459]"
              >
                Saved! Scraping data...
              </motion.span>
            )}
          </div>
        </div>
      </form>

      {/* Skills preview */}
      {skills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 rounded-2xl border border-white/5 bg-[#1a1a1e] p-5 sm:p-6"
        >
          <h2 className="mb-3 text-sm font-medium text-[#e4e4e7]">Extracted Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-[#534AB744] bg-[#534AB722] px-3 py-1 text-xs text-[#AFA9EC]"
              >
                {skill}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* GitHub repos preview */}
      {githubData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 rounded-2xl border border-white/5 bg-[#1a1a1e] p-5 sm:p-6"
        >
          <h2 className="mb-3 text-sm font-medium text-[#e4e4e7]">GitHub Repos</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {githubData.map((repo) => (
              <div
                key={repo.name}
                className="rounded-xl border border-white/5 bg-[#0d0d0f] p-3"
              >
                <p className="text-sm font-medium text-[#e4e4e7]">{repo.name}</p>
                {repo.description && (
                  <p className="mt-1 text-xs leading-relaxed text-[#71717a] line-clamp-2">
                    {repo.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3">
                  {repo.language && (
                    <span className="text-xs text-[#a1a1aa]">{repo.language}</span>
                  )}
                  {repo.stargazers_count > 0 && (
                    <span className="text-xs text-[#52525b]">
                      {repo.stargazers_count} stars
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
