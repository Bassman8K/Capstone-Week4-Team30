import type { LogType } from './types'

/**
 * The log types shown on /log, matching the "Logging" frame in the Refined
 * Concepts Figma. Add a type here and its card appears automatically — but
 * remember to add the matching route under app/(dashboard)/log/.
 */
export const logTypes: LogType[] = [
  { id: 'mood', label: 'Mood Log', description: 'How they seemed through the day.' },
  { id: 'food', label: 'Food Log', description: 'Meals, snacks, and anything refused.' },
  { id: 'sleep', label: 'Sleep Log', description: 'Hours slept and how settled the night was.' },
  {
    id: 'stress',
    label: 'Stress Log',
    description: 'Moments of overwhelm and what preceded them.',
  },
  {
    id: 'schedule',
    label: 'Schedule Logging',
    description: 'School hours, appointments, routine changes.',
  },
  { id: 'observation', label: 'Observation Log', description: 'Anything else worth remembering.' },
]
