import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { ScaffoldNotice } from '@/components/shared/ScaffoldNotice'

export const metadata: Metadata = {
  title: 'Sleep Log',
}

export default function SleepLogPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Sleep Log" description="Hours slept and how settled the night was." />
      <ScaffoldNotice>
        The entry form for this log isn&apos;t built yet. Shared entry fields live in{' '}
        <code>features/logging/types.ts</code>.
      </ScaffoldNotice>
    </div>
  )
}
