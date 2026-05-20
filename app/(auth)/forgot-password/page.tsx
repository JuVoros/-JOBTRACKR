'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'

const inputClasses =
  'h-11 w-full border border-rule bg-paper px-3 font-sans text-sm text-ink outline-none placeholder:text-rule transition-colors focus:border-ink'

const labelClasses =
  'mb-1.5 block font-mono text-[10px] tracking-widest uppercase text-ink-mid'

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [error, setError]   = useState<string | null>(null)
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  // Success state — replaces the form entirely
  if (sent) {
    return (
      <div className="space-y-3">
        <p className="font-display text-3xl italic font-light text-ink">
          Check your inbox.
        </p>
        <div className="h-px w-2/5 bg-rule" />
        <p className="font-mono text-[11px] text-ink-mid leading-relaxed">
          A reset link has been sent to{' '}
          <span className="text-ink">{email}</span>.
        </p>
        <p className="font-mono text-[10px] text-rule pt-2">
          Didn&apos;t receive it? Check your spam folder.
        </p>
        <div className="pt-4">
          <Link
            href="/login"
            className="font-mono text-[10px] tracking-widest uppercase text-ink-mid hover:text-ink transition-colors"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Section label — like a form header in a ledger */}
      <div className="space-y-1">
        <p className="font-mono text-[10px] tracking-widest uppercase text-ink-mid">
          Recover access
        </p>
        <p className="font-sans text-sm font-light text-ink-mid">
          Enter the email address attached to your account.
        </p>
      </div>

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

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-stamp-red py-3 font-mono text-[10px] tracking-widest uppercase text-paper transition-colors hover:bg-stamp-red/90 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send reset link'}
      </button>

      <Link
        href="/login"
        className="block text-center font-mono text-[10px] tracking-widest uppercase text-ink-mid hover:text-ink transition-colors"
      >
        ← Back to sign in
      </Link>
    </form>
  )
}
