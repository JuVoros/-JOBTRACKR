'use client'

import LogoutButton from './LogoutButton'

interface SidebarProps {
  email: string
}

export default function Sidebar({ email }: SidebarProps) {
  return (
    <aside className="hidden h-screen w-56 flex-col border-r border-white/5 bg-[#0d0d0f] px-4 py-6 lg:flex">
      <div className="mb-8 px-2">
        <h1 className="text-base font-bold tracking-tight text-[#e4e4e7]">JobTrackr</h1>
      </div>

      <nav className="flex-1 space-y-1">
        <div className="flex h-10 items-center gap-2.5 rounded-xl bg-white/5 px-3 text-sm font-medium text-[#e4e4e7]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Dashboard
        </div>
      </nav>

      <div className="border-t border-white/5 pt-4">
        <p className="mb-3 truncate px-2 text-xs text-[#52525b]">{email}</p>
        <LogoutButton />
      </div>
    </aside>
  )
}
