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
/**
 * Returns only snapshot information that is directly relevant to the
 * caregiver's current message.
 *
 * The full snapshot remains visible in the context drawer, but unrelated
 * details are not pushed into every Hermes request.
 */
export function describeRelevantChildContext(
  snapshot: ChildContextSnapshot,
  situation: string
): string | undefined {
  const text = situation.trim().toLowerCase()

  const relevantLabels = new Set<string>()

  if (
    /\b(sleep|slept|tired|bedtime|night|wake|woke)\b/.test(text)
  ) {
    relevantLabels.add('Sleep')
  }

  if (
    /\b(breakfast|morning meal)\b/.test(text)
  ) {
    relevantLabels.add('Breakfast')
  }

  if (
    /\b(mood|upset|stressed|stress|anxious|anxiety|angry|sad|calm)\b/.test(
      text
    )
  ) {
    relevantLabels.add('Mood')
  }

  if (
    /\b(school|class|teacher|homework|classroom)\b/.test(text)
  ) {
    relevantLabels.add('School')
  }

  if (
    /\b(appointment|doctor|clinic|therapy|therapist)\b/.test(text)
  ) {
    relevantLabels.add('Appointment')
  }

  const relevantEntries = childContextEntries(snapshot).filter(
    (entry): entry is [string, string] =>
      entry[1] !== null &&
      entry[1].trim() !== '' &&
      relevantLabels.has(entry[0])
  )

  if (relevantEntries.length === 0) {
    return undefined
  }

  return relevantEntries
    .map(([label, value]) => `${label}: ${value}.`)
    .join(' ')
}