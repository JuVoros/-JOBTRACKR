'use client'

import { usePathname } from 'next/navigation'
import LogoutButton from './LogoutButton'

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/dashboard',
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
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      ),
    },
    {
      href: '/profile',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex h-12 items-center justify-around border-t border-white/5 bg-[#0d0d0f]/95 backdrop-blur-md lg:hidden">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          pathname.startsWith(item.href + '/') ||
          (item.href === '/generate/new' && pathname.startsWith('/generate/'))
        return (
          <a
            key={item.href}
            href={item.href}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              isActive
                ? 'bg-white/5 text-[#e4e4e7]'
                : 'text-[#52525b] hover:text-[#a1a1aa]'
            }`}
          >
            {item.icon}
          </a>
        )
      })}
      <LogoutButton />
    </nav>
  )
}
