'use client'

import { usePathname } from 'next/navigation'
import LogoutButton from './LogoutButton'

interface SidebarProps {
  email: string
}

const navItems = [
  { href: '/dashboard', label: 'DASHBOARD' },
  { href: '/generate/new', label: 'GENERATE', matchPrefix: '/generate/' },
  { href: '/profile', label: 'PROFILE' },
]

export default function Sidebar({ email }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden h-screen w-60 flex-col border-r border-rule bg-paper-dark lg:flex">
      {/* Wordmark */}
      <div className="border-b border-rule px-6 py-5">
        <span className="font-display text-lg italic font-semibold tracking-wide text-ink">
          JobTrackr
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.matchPrefix ? pathname.startsWith(item.matchPrefix) : false)

          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex h-11 items-center px-6 font-mono text-[11px] tracking-[0.12em] transition-colors ${
                isActive
                  ? 'text-ink ledger-row-active'
                  : 'text-ink-mid ledger-row'
              }`}
            >
              {item.label}
            </a>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-rule px-6 py-4">
        <p className="mb-3 truncate font-mono text-[11px] text-ink-mid">{email}</p>
        <LogoutButton />
      </div>
    </aside>
  )
}
