'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-[#e4e4e7]">JobTrackr</h1>
          <p className="mt-1 text-sm text-[#52525b]">Create your account</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
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
              className="h-11 w-full rounded-xl border border-white/5 bg-[#1a1a1e] px-3 text-sm text-[#e4e4e7] outline-none placeholder:text-[#3f3f46] focus:border-[#7F77DD]/40 focus:ring-1 focus:ring-[#7F77DD]/40"
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
              className="h-11 w-full rounded-xl border border-white/5 bg-[#1a1a1e] px-3 text-sm text-[#e4e4e7] outline-none placeholder:text-[#3f3f46] focus:border-[#7F77DD]/40 focus:ring-1 focus:ring-[#7F77DD]/40"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-[#7F77DD] text-sm font-semibold text-white transition-colors hover:bg-[#938BF0] disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#52525b]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#7F77DD] hover:text-[#938BF0]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
