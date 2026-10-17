/**
 * A child being supported in the app. Everything the assistant needs to give
 * context-aware advice hangs off this.
 */
export interface ChildProfile {
  id: string
  name: string
  age: number
  /** Things that tend to set the child off — fed to the assistant as context. */
  knownTriggers: string[]
  /** Strategies already tried, so the assistant doesn't re-suggest them. */
  previousStrategies: string[]
}

/**
 * The at-a-glance snapshot shown in the AI chat's "<name>'s Info" drawer
 * (see the "AI - showing context" frame in the Refined Concepts Figma).
 *
 * Every field is nullable — it's derived from whatever the carer has logged
 * today, and they won't always have logged everything. The fields follow Mei's
 * Sprint 3 "AI Tab - Context Tab" frames.
 */
export interface ChildContextSnapshot {
  /** e.g. '11:30 pm' */
  bedtime: string | null
  /** e.g. '6:00 am' */
  wokeUp: string | null
  sleepHours: number | null
  breakfast: string | null
  lunch: string | null
  dinner: string | null
  lastSnack: string | null
  mood: string | null
  stress: string | null
  /** e.g. '9:00-3:00' */
  schoolHours: string | null
  /** e.g. '4:30' */
  nextAppointment: string | null
}
