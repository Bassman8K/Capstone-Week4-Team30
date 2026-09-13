import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { LogTypeCard } from '@/features/logging/components/LogTypeCard'
import { logTypes } from '@/features/logging/data'

export const metadata: Metadata = {
  title: 'Log',
}

export default function LogPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Log" description="Record what happened today." />

      <div className="grid gap-3 sm:grid-cols-2">
        {logTypes.map((logType) => (
          <LogTypeCard key={logType.id} logType={logType} />
        ))}
      </div>
    </div>
  )
}
