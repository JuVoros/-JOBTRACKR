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
          className="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[#52525b] transition-colors hover:text-[#a1a1aa]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          <span className="text-[10px] font-medium tracking-wide">Log out</span>
        </button>
      ) : (
        <button
          onClick={() => setConfirmOpen(true)}
          type="button"
          className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm text-[#71717a] transition-colors hover:bg-white/5 hover:text-[#e4e4e7]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="hidden lg:inline">Log out</span>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
            onClick={() => !loggingOut && setConfirmOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/5 bg-[#1a1a1e] p-6 shadow-2xl"
            >
              <h3 className="text-base font-semibold text-[#e4e4e7]">
                Are you sure you want to log out?
              </h3>
              <p className="mt-1.5 text-sm text-[#71717a]">
                You&apos;ll need to sign in again to access your applications.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  disabled={loggingOut}
                  className="h-11 flex-1 rounded-xl border border-white/5 text-sm font-medium text-[#a1a1aa] transition-colors hover:bg-white/5 hover:text-[#e4e4e7] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="h-11 flex-1 rounded-xl bg-[#7F77DD] text-sm font-semibold text-white transition-colors hover:bg-[#938BF0] disabled:opacity-60"
                >
                  {loggingOut ? 'Logging out...' : 'Log Out'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
