import { describe, it, expect } from 'vitest'
import {
  childContextEntries,
  childContextSections,
  describeChildContext,
  describeRelevantChildContext,
} from '@/features/children/context'
import type { ChildContextSnapshot } from '@/features/children/types'

const full: ChildContextSnapshot = {
  sleepHours: 6.5,
  breakfast: 'Skipped',
  mood: 'Stressed',
  schoolHours: '9:00-3:00',
  nextAppointment: '4:30',
}

const empty: ChildContextSnapshot = {
  sleepHours: null,
  breakfast: null,
  mood: null,
  schoolHours: null,
  nextAppointment: null,
}

describe('describeChildContext', () => {
  it('turns the snapshot into the recentContext string the adapter expects', () => {
    expect(describeChildContext(full)).toBe(
      'Sleep: 6.5 hours. Breakfast: Skipped. Mood: Stressed. School: 9:00-3:00. Appointment: 4:30.'
    )
  })

  it('leaves out anything the carer has not logged', () => {
    // The prompt treats supplied context as fact, so "Not logged" must never
    // be sent as if it were a value.
    const text = describeChildContext({ ...empty, mood: 'Calm' })

    expect(text).toBe('Mood: Calm.')
    expect(text).not.toMatch(/not logged/i)
  })

  it('returns undefined when nothing is logged so the field is omitted', () => {
    expect(describeChildContext(empty)).toBeUndefined()
  })

  it('keeps the same labels and order as the info panel', () => {
    expect(childContextEntries(full).map(([label]) => label)).toEqual([
      'Sleep',
      'Breakfast',
      'Mood',
      'School',
      'Appointment',
    ])
  })
})

describe('childContextSections', () => {
  it('groups the context under the headings from the design', () => {
    expect(childContextSections(full).map((section) => section.heading)).toEqual([
      'Sleep',
      'Food',
      'Observations',
      'Events',
    ])
  })

  it('shows every entry exactly once, so nothing sent to the AI is hidden from the carer', () => {
    const shown = childContextSections(full).flatMap((section) =>
      section.rows.map((row) => row.value)
    )
    const sent = childContextEntries(full).map(([, value]) => value)

    expect(shown.sort()).toEqual(sent.sort())
  })

  it('keeps unlogged values as null for the panel to label', () => {
    const rows = childContextSections(empty).flatMap((section) => section.rows)

    expect(rows.every((row) => row.value === null)).toBe(true)
  })

  it('does not change what is sent to the AI', () => {
    expect(describeChildContext(full)).toBe(
      'Sleep: 6.5 hours. Breakfast: Skipped. Mood: Stressed. School: 9:00-3:00. Appointment: 4:30.'
    )
  })
})

describe('describeRelevantChildContext', () => {
  it('includes breakfast for any eating question', () => {
    // For the demo scenario, a skipped breakfast is the most relevant fact.
    expect(describeRelevantChildContext(full, "Ben isn't eating his dinner")).toMatch(
      /Breakfast: Skipped/
    )
  })

  it('still leaves out unrelated context', () => {
    expect(describeRelevantChildContext(full, 'Ben is building lego')).toBeUndefined()
  })
})
