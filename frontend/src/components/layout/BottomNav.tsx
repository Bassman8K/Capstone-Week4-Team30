'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MessageSquare, PlusSquare } from 'lucide-react'

/**
 * The three-tab bar from the Refined Concepts designs (Log · AI Chat ·
 * Dashboard). Mobile only — on large screens the Sidebar covers navigation,
 * so this hides itself.
 */
const tabs = [
  { href: '/log', label: 'Log', icon: PlusSquare },
  { href: '/ai-chat', label: 'AI Chat', icon: MessageSquare },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-brand-500 border-brand-600 flex items-stretch border-t lg:hidden">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
              active ? 'text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
