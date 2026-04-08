'use client'

import LogoutButton from './LogoutButton'

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-center justify-around border-t border-white/5 bg-[#0d0d0f]/95 backdrop-blur-md lg:hidden">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-[#e4e4e7]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </div>
      <LogoutButton />
    </nav>
  )
}
