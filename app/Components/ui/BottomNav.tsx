'use client'

import { usePathname } from 'next/navigation'
import LogoutButton from './LogoutButton'

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        </svg>
      ),
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-stretch justify-around border-t border-white/5 bg-[#0d0d0f]/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          pathname.startsWith(item.href + '/') ||
          (item.href === '/generate/new' && pathname.startsWith('/generate/'))
        return (
          <a
            key={item.href}
            href={item.href}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 transition-colors ${
              isActive
                ? 'text-[#e4e4e7]'
                : 'text-[#52525b] hover:text-[#a1a1aa]'
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                isActive ? 'bg-white/5' : ''
              }`}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
          </a>
        )
      })}
      <LogoutButton variant="bottomnav" />
    </nav>
  )
}
