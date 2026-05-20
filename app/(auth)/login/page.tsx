'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'

const inputClasses =
  'h-11 w-full border border-rule bg-paper px-3 font-sans text-sm text-ink outline-none placeholder:text-rule transition-colors focus:border-ink'

const labelClasses =
  'mb-1.5 block font-mono text-[10px] tracking-widest uppercase text-ink-mid'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const router  = useRouter()
  const supabase = createClient()

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

    router.replace('/dashboard')
  }

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      {/* Left-border error — a correction mark in the margin */}
      {error && (
        <div className="border-l-[3px] border-stamp-red bg-stamp-red/5 px-4 py-3">
          <p className="font-mono text-[11px] text-stamp-red">{error}</p>
        </div>
      )}

      <div>
        <label className={labelClasses}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
          className={inputClasses}
        />
      </div>

      <div>
        <label className={labelClasses}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className={inputClasses}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-stamp-red py-3 font-mono text-[10px] tracking-widest uppercase text-paper transition-colors hover:bg-stamp-red/90 disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>

      <div className="space-y-2 text-center">
        <p className="font-mono text-[11px] text-ink-mid">
          No account?{' '}
          <Link href="/signup" className="text-ink underline underline-offset-2 hover:text-stamp-blue transition-colors">
            Sign up
          </Link>
        </p>
        <p>
          <Link
            href="/forgot-password"
            className="font-mono text-[10px] tracking-wide text-rule hover:text-ink-mid transition-colors"
          >
            Forgot password?
          </Link>
        </p>
      </div>
    </form>
  )
}
