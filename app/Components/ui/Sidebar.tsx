'use client'

import { usePathname } from 'next/navigation'
import LogoutButton from './LogoutButton'

interface SidebarProps {
  email: string
}

export default function Sidebar({ email }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      href: '/generate/new',
      label: 'Generate',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      ),
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ]

  return (
    <aside className="hidden h-screen w-56 flex-col border-r border-white/5 bg-[#0d0d0f] px-4 py-6 lg:flex">
      <div className="mb-8 px-2">
        <h1 className="text-base font-bold tracking-tight text-[#e4e4e7]">JobTrackr</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive =
          pathname === item.href ||
          pathname.startsWith(item.href + '/') ||
          (item.href === '/generate/new' && pathname.startsWith('/generate/'))
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex h-10 items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/5 text-[#e4e4e7]'
                  : 'text-[#52525b] hover:bg-white/[0.03] hover:text-[#a1a1aa]'
              }`}
            >
              {item.icon}
              {item.label}
            </a>
          )
        })}
      </nav>

      <div className="border-t border-white/5 pt-4">
        <p className="mb-3 truncate px-2 text-xs text-[#52525b]">{email}</p>
        <LogoutButton />
      </div>
    </aside>
  )
}
