'use client'

import { usePathname } from 'next/navigation'
import LogoutButton from './LogoutButton'

const navItems = [
  { href: '/dashboard', label: 'DASH' },
  { href: '/generate/new', label: 'GEN', matchPrefix: '/generate/' },
  { href: '/profile', label: 'PROFILE' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex h-14 items-stretch justify-around border-t border-rule bg-paper-dark lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.matchPrefix ? pathname.startsWith(item.matchPrefix) : false)

        return (
          <a
            key={item.href}
            href={item.href}
            className={`flex flex-1 items-center justify-center transition-colors ${
              isActive ? 'text-ink' : 'text-ink-mid hover:text-ink'
            }`}
          >
            <span
              className={`font-mono text-[10px] tracking-[0.12em] ${
                isActive ? 'border-b border-ink pb-px' : ''
              }`}
            >
              {item.label}
            </span>
          </a>
        )
      })}
      <LogoutButton variant="bottomnav" />
    </nav>
  )
}
