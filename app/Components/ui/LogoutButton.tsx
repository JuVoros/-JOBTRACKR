'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
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
  )
}
