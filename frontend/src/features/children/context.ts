import type { ChildContextSnapshot } from './types'

/**
 * The child's context for today as labelled entries, in the order the
 * "<name>'s Info" panel shows them. `null` means the carer hasn't logged it.
 *
 * The panel and the AI request both read from this, so what the carer sees is
 * exactly what the assistant is told — Sprint 3 tracing found the panel showing
 * sleep, breakfast and mood that never reached the AI.
 */
export function childContextEntries(snapshot: ChildContextSnapshot): Array<[string, string | null]> {
  return [
    ['Sleep', snapshot.sleepHours === null ? null : `${snapshot.sleepHours} hours`],
    ['Breakfast', snapshot.breakfast],
    ['Mood', snapshot.mood],
    ['School', snapshot.schoolHours],
    ['Appointment', snapshot.nextAppointment],
  ]
}

/**
 * The snapshot as the adapter's `recentContext` string, e.g.
 * "Sleep: 6.5 hours. Breakfast: Skipped. Mood: Stressed."
 *
 * Unlogged fields are left out rather than sent as "Not logged" — the prompt
 * treats supplied context as fact. Returns undefined when nothing is logged so
 * the field is omitted (the adapter rejects an empty string).
 */
export function describeChildContext(snapshot: ChildContextSnapshot): string | undefined {
  const logged = childContextEntries(snapshot).filter(
    (entry): entry is [string, string] => entry[1] !== null && entry[1].trim() !== ''
  )

  if (logged.length === 0) return undefined

  return logged.map(([label, value]) => `${label}: ${value}.`).join(' ')
}
