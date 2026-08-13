import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-zinc-950">
      <div className="bg-brand-100 w-full max-w-sm rounded-2xl p-8 shadow-sm dark:bg-zinc-900">
        {children}
      </div>
    </div>
  )
}
