import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Home',
  description: "Track your child's day and get calm, practical help with mealtimes.",
}

export default function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="bg-brand-100 w-full max-w-md space-y-8 rounded-2xl p-8 text-center shadow-sm">
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            {process.env.NEXT_PUBLIC_APP_NAME ?? 'App'}
          </h1>
          <p className="text-base text-zinc-700">
            Track your child&apos;s sleep, meals and mood, and get calm, practical suggestions from
            an AI assistant when mealtimes get hard.
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="bg-brand-300 hover:bg-brand-400 block w-full rounded-full px-4 py-2.5 text-center text-sm font-medium text-zinc-900 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="block w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  )
}
