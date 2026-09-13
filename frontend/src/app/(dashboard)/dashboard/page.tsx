import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from '@/actions/auth.actions'
import { adminDb } from '@/lib/firebase/admin'
import { ScaffoldNotice } from '@/components/shared/ScaffoldNotice'
import { DashboardCard } from '@/features/dashboard/components/DashboardCard'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const session = await getServerSession()
  const profileSnap = session ? await adminDb.collection('users').doc(session.uid).get() : null

  const displayName = profileSnap?.exists
    ? (profileSnap.data()?.displayName as string | null)
    : null
  const greetingName = displayName ?? session?.email ?? null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hello{greetingName ? `, ${greetingName}` : ''}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Today at a glance.</p>
      </div>

      <ScaffoldNotice>
        Section layout only — every card below is a placeholder. Cards read from the logs once those
        screens save data.
      </ScaffoldNotice>

      {/* Daily narrative summary — the wide card at the top of the design. */}
      <DashboardCard>
        <p className="text-zinc-400">
          Daily summary will go here — a plain-language recap of anything notable in today&apos;s
          logs.
        </p>
      </DashboardCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <DashboardCard title="What's happening?">
          <p className="text-zinc-400">Current point in the day&apos;s routine.</p>
        </DashboardCard>
        <DashboardCard title="Sleep">
          <p className="text-zinc-400">Last night&apos;s sleep, from the sleep log.</p>
        </DashboardCard>
      </div>

      <DashboardCard title="Weekly At A Glance" href="/dashboard/observations">
        {/*
          Mood-over-the-week chart. Deliberately left as an empty slot — picking a
          charting approach is its own piece of work, not part of the scaffold.
        */}
        <div className="flex h-32 items-center justify-center rounded border border-dashed border-zinc-200 text-xs text-zinc-400">
          Weekly mood chart
        </div>
      </DashboardCard>

      <DashboardCard title="Food">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {['Breakfast', 'Lunch', 'Dinner'].map((meal) => (
            <div key={meal} className="rounded border border-zinc-200 p-2">
              <p className="font-medium text-zinc-700">{meal}</p>
              <p className="mt-1 text-zinc-400">—</p>
            </div>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard title="Recommendations">
        <p className="text-zinc-400">
          Suggestions from the assistant, based on patterns across the logs.
        </p>
      </DashboardCard>

      <Link href="/dashboard/observations" className="block text-sm text-zinc-500 hover:underline">
        View observations →
      </Link>
    </div>
  )
}
