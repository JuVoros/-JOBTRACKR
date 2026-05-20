'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import Link from 'next/link'

const inputClasses =
  'h-11 w-full border border-rule bg-paper px-3 font-sans text-sm text-ink outline-none placeholder:text-rule transition-colors focus:border-ink'

const labelClasses =
  'mb-1.5 block font-mono text-[10px] tracking-widest uppercase text-ink-mid'

export default function SignupPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const router   = useRouter()
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
    <form onSubmit={handleSignup} className="space-y-5">
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
          autoComplete="new-password"
          placeholder="••••••••"
          className={inputClasses}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-stamp-red py-3 font-mono text-[10px] tracking-widest uppercase text-paper transition-colors hover:bg-stamp-red/90 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Create account'}
      </button>

      <p className="text-center font-mono text-[11px] text-ink-mid">
        Already have an account?{' '}
        <Link href="/login" className="text-ink underline underline-offset-2 hover:text-stamp-blue transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  )
}
