/** The six log types on the Logging screen, in the order the design lists them. */
export type LogTypeId = 'mood' | 'food' | 'sleep' | 'stress' | 'schedule' | 'observation'

export interface LogType {
  id: LogTypeId
  label: string
  /** One line explaining what goes in this log — shown on the card. */
  description: string
}

/**
 * Fields every log entry shares. Individual log types extend this with their
 * own payload once those screens get built.
 */
export interface LogEntryBase {
  id: string
  childId: string
  type: LogTypeId
  /** ISO 8601. */
  recordedAt: string
  notes?: string
}
