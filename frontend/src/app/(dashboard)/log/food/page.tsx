import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { ScaffoldNotice } from '@/components/shared/ScaffoldNotice'

export const metadata: Metadata = {
  title: 'Food Log',
}

export default function FoodLogPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Food Log" description="Meals, snacks, and anything refused." />
      <ScaffoldNotice>
        The entry form for this log isn&apos;t built yet. Shared entry fields live in{' '}
        <code>features/logging/types.ts</code>.
      </ScaffoldNotice>
    </div>
  )
}
