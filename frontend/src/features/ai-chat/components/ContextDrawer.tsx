import type { ChildContextSnapshot } from '@/features/children/types'

/**
 * The "<name>'s Info" panel behind the chat's hamburger menu ("AI - showing
 * context" frame). Shows what the assistant already knows, so the carer can
 * see why it's suggesting what it is.
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
    <aside className="rounded-lg bg-slate-700 p-4 text-white">
      <h2 className="text-sm font-semibold">{childName}&apos;s Info</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <li key={label} className="flex gap-2">
            <span aria-hidden="true">•</span>
            <span>
              {label}: {value}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
