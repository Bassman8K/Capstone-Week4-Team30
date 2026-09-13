import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { BottomNav } from './BottomNav'

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-brand-50 flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
        <BottomNav />
      </div>
    </div>
  )
}
