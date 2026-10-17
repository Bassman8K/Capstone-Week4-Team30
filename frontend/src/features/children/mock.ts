import type { ChildContextSnapshot, ChildProfile } from './types'

/**
 * Stand-in child until profiles are stored in Firestore. Values match the
 * "AI - showing context" frame in the Refined Concepts Figma so the mocked
 * flow matches the design's reference scenario.
 */
export const mockChild: ChildProfile = {
  id: 'mock-child',
  name: 'Ben',
  age: 8,
  knownTriggers: ['Loud environments', 'Unexpected changes to routine'],
  previousStrategies: ['Noise-cancelling headphones', 'Visual schedule on the fridge'],
}

/**
 * A full day's log, so the info panel has enough in it to scroll (Mei's
 * Sprint 3 Week 2 review). Dinner is deliberately unlogged — the demo prompt
 * is "Ben isn't eating his dinner".
 */
export const mockChildContext: ChildContextSnapshot = {
  bedtime: '11:30 pm',
  wokeUp: '6:00 am',
  sleepHours: 6.5,
  breakfast: 'Skipped',
  lunch: 'Spaghetti at 12 pm',
  dinner: null,
  lastSnack: 'Fruit platter at 3 pm',
  mood: 'Stressed',
  stress: 'High at 3 pm',
  schoolHours: '9:00-3:00',
  nextAppointment: '4:30',
}
