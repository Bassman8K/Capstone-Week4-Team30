import type { ChildContextSnapshot } from '@/features/children/types'

/**
 * The "<name>'s Info" panel that slides in from the chat's hamburger menu
 * ("AI - showing context" frame). Shows what the assistant already knows, so
 * the carer can see why it's advising what it is.
 *
 * Rendered inline for now — the slide-in behaviour comes with the real screen.
 */
export function ContextDrawer({
  childName,
  snapshot,
}: {
  childName: string
  snapshot: ChildContextSnapshot
}) {
  const rows: Array<[string, string]> = [
    ['Sleep', snapshot.sleepHours === null ? 'Not logged' : `${snapshot.sleepHours} hours`],
    ['Breakfast', snapshot.breakfast ?? 'Not logged'],
    ['Mood', snapshot.mood ?? 'Not logged'],
    ['School', snapshot.schoolHours ?? 'Not logged'],
    ['Appointment', snapshot.nextAppointment ?? 'None today'],
  ]

  return (
    <aside className="rounded-lg border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-900">{childName}&apos;s Info</h2>
      <dl className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 text-sm">
            <dt className="text-zinc-500">{label}</dt>
            <dd className="text-zinc-900">{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}
