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
      className="rounded-xl border border-gold/25 bg-surface-muted/60 px-4 py-2 text-sm text-ink-muted transition-all duration-200 hover:border-gold/50 hover:text-ink hover:shadow-[0_0_16px_-6px_rgba(212,175,55,0.32)]"
    >
      Log out
    </button>
  )
}
