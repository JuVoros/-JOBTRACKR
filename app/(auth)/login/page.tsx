'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Pre-warm the dashboard route so post-login navigation is instant
  useEffect(() => {
    router.prefetch('/dashboard')
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Navigate immediately — don't wait for a server revalidation round-trip
    router.replace('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-[#e4e4e7]">JobTrackr</h1>
          <p className="mt-1 text-sm text-[#52525b]">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-[#A32D2D44] bg-[#A32D2D22] px-4 py-3 text-sm text-[#F09595]">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#71717a]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-11 w-full rounded-xl border border-white/5 bg-[#1a1a1e] px-3 text-base sm:text-sm text-[#e4e4e7] outline-none placeholder:text-[#3f3f46] focus:border-[#7F77DD]/40 focus:ring-1 focus:ring-[#7F77DD]/40"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#71717a]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border border-white/5 bg-[#1a1a1e] px-3 text-base sm:text-sm text-[#e4e4e7] outline-none placeholder:text-[#3f3f46] focus:border-[#7F77DD]/40 focus:ring-1 focus:ring-[#7F77DD]/40"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7F77DD] text-sm font-semibold text-white transition-colors hover:bg-[#938BF0] disabled:opacity-70"
          >
            {loading && (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#52525b]">
          No account?{' '}
          <Link href="/signup" className="text-[#7F77DD] hover:text-[#938BF0]">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
