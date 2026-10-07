import { childContextEntries } from '@/features/children/context'
import type { ChildContextSnapshot } from '@/features/children/types'

/**
 * The "<name>'s Info" panel behind the chat's hamburger menu ("AI - showing
 * context" frame). Shows what the assistant already knows, so the carer can
 * see why it's suggesting what it is.
 */
export function ContextDrawer({
  childName,
  snapshot,
  className = '',
}: {
  childName: string
  snapshot: ChildContextSnapshot
  /** Positioning from the parent — it decides overlay vs. side column. */
  className?: string
}) {
  // Same entries the AI request is built from — see childContextEntries.
  const rows = childContextEntries(snapshot).map(
    ([label, value]): [string, string] => [
      label,
      value ?? (label === 'Appointment' ? 'None today' : 'Not logged'),
    ]
  )

  return (
    <aside className={`rounded-lg bg-slate-700 p-4 text-white ${className}`}>
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
