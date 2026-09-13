import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { ScaffoldNotice } from '@/components/shared/ScaffoldNotice'

export const metadata: Metadata = {
  title: 'Observations',
}

export default function ObservationsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Observations"
        description="A timestamped view of what was noticed today."
      />

      <ScaffoldNotice>
        Timeline isn&apos;t built yet — entries will read from the observation log and render
        against their time of day.
      </ScaffoldNotice>

      <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
        ← Back to dashboard
      </Link>
    </div>
  )
}
