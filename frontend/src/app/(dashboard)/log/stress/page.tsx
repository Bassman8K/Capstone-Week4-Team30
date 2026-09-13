import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { ScaffoldNotice } from '@/components/shared/ScaffoldNotice'

export const metadata: Metadata = {
  title: 'Stress Log',
}

export default function StressLogPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Stress Log" description="Moments of overwhelm and what preceded them." />
      <ScaffoldNotice>
        The entry form for this log isn&apos;t built yet. Shared entry fields live in{' '}
        <code>features/logging/types.ts</code>.
      </ScaffoldNotice>
    </div>
  )
}
