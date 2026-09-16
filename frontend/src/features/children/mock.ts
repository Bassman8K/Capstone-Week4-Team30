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

export const mockChildContext: ChildContextSnapshot = {
  sleepHours: 6.5,
  breakfast: 'Skipped',
  mood: 'Stressed',
  schoolHours: '9:00-3:00',
  nextAppointment: '4:30',
}
