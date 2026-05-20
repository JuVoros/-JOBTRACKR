'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '../../lib/supabase/client'

interface LogoutButtonProps {
  variant?: 'sidebar' | 'bottomnav'
}

export default function LogoutButton({ variant = 'sidebar' }: LogoutButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {variant === 'bottomnav' ? (
        <button
          onClick={() => setConfirmOpen(true)}
          type="button"
          className="flex flex-1 items-center justify-center text-ink-mid transition-colors hover:text-ink"
        >
          <span className="font-mono text-[10px] tracking-[0.12em]">EXIT</span>
        </button>
      ) : (
        <button
          onClick={() => setConfirmOpen(true)}
          type="button"
          className="flex h-9 w-full items-center font-mono text-[11px] tracking-widest text-ink-mid uppercase transition-colors hover:text-stamp-red"
        >
          Log out
        </button>
      )}

      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            key="logout-confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4"
            onClick={() => !loggingOut && setConfirmOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm border border-rule bg-paper p-6"
            >
              <p className="font-mono text-[10px] tracking-widest uppercase text-ink-mid mb-3">
                Confirm
              </p>
              <p className="font-display text-xl font-semibold italic text-ink">
                Log out?
              </p>
              <p className="mt-2 font-sans text-sm text-ink-mid">
                You&apos;ll need to sign in again to access your applications.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  disabled={loggingOut}
                  className="flex-1 border border-rule py-2.5 font-mono text-xs tracking-widest uppercase text-ink-mid transition-colors hover:bg-paper-alt disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex-1 bg-ink py-2.5 font-mono text-xs tracking-widest uppercase text-paper transition-colors hover:bg-ink/90 disabled:opacity-60"
                >
                  {loggingOut ? 'Signing out...' : 'Log out'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
