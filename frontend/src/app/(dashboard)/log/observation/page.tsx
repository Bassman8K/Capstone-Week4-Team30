import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { ScaffoldNotice } from '@/components/shared/ScaffoldNotice'

export const metadata: Metadata = {
  title: 'Observation Log',
}

export default function ObservationLogPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Observation Log" description="Anything else worth remembering." />
      <ScaffoldNotice>
        The entry form for this log isn&apos;t built yet. Shared entry fields live in{' '}
        <code>features/logging/types.ts</code>.
      </ScaffoldNotice>
    </div>
  )
}
