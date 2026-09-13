import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { ScaffoldNotice } from '@/components/shared/ScaffoldNotice'

export const metadata: Metadata = {
  title: 'Schedule Logging',
}

export default function ScheduleLogPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Schedule Logging"
        description="School hours, appointments, routine changes."
      />
      <ScaffoldNotice>
        The entry form for this log isn&apos;t built yet. Shared entry fields live in{' '}
        <code>features/logging/types.ts</code>.
      </ScaffoldNotice>
    </div>
  )
}
