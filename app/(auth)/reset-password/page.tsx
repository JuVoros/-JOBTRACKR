'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

const inputClasses =
  'h-11 w-full border border-rule bg-paper px-3 font-sans text-sm text-ink outline-none placeholder:text-rule transition-colors focus:border-ink'

const labelClasses =
  'mb-1.5 block font-mono text-[10px] tracking-widest uppercase text-ink-mid'

export default function ResetPasswordPage() {
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [verified, setVerified]   = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  // Supabase fires PASSWORD_RECOVERY when the user arrives via the reset link.
  // We wait for this before showing the form to confirm the token is valid.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setVerified(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.replace('/dashboard')
  }

  // Waiting for the recovery token exchange
  if (!verified) {
    return (
      <div className="space-y-3">
        <p className="font-mono text-[10px] tracking-widest uppercase text-ink-mid">
          Verifying reset link...
        </p>
        <div className="h-px w-2/5 bg-rule" />
        <p className="font-sans text-sm font-light text-ink-mid">
          If this page doesn&apos;t proceed, the link may have expired.{' '}
          <a href="/forgot-password" className="text-ink underline underline-offset-2">
            Request a new one.
          </a>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleReset} className="space-y-5">
      <div className="space-y-1">
        <p className="font-mono text-[10px] tracking-widest uppercase text-ink-mid">
          Set new password
        </p>
        <div className="h-px w-2/5 bg-rule" />
      </div>

      {error && (
        <div className="border-l-[3px] border-stamp-red bg-stamp-red/5 px-4 py-3">
          <p className="font-mono text-[11px] text-stamp-red">{error}</p>
        </div>
      )}

      <div>
        <label className={labelClasses}>New password</label>
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

      <div>
        <label className={labelClasses}>Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
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
        {loading ? 'Updating...' : 'Update password'}
      </button>
    </form>
  )
}
