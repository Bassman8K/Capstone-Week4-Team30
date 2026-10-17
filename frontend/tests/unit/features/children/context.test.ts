import { describe, it, expect } from 'vitest'
import {
  childContextEntries,
  childContextSections,
  describeChildContext,
  describeRelevantChildContext,
} from '@/features/children/context'
import type { ChildContextSnapshot } from '@/features/children/types'

const full: ChildContextSnapshot = {
  bedtime: '11:30 pm',
  wokeUp: '6:00 am',
  sleepHours: 6.5,
  breakfast: 'Skipped',
  lunch: 'Spaghetti at 12 pm',
  dinner: 'Not finished',
  lastSnack: 'Fruit platter at 3 pm',
  mood: 'Stressed',
  stress: 'High at 3 pm',
  schoolHours: '9:00-3:00',
  nextAppointment: '4:30',
}

const empty: ChildContextSnapshot = {
  bedtime: null,
  wokeUp: null,
  sleepHours: null,
  breakfast: null,
  lunch: null,
  dinner: null,
  lastSnack: null,
  mood: null,
  stress: null,
  schoolHours: null,
  nextAppointment: null,
}

const FULL_CONTEXT =
  'Bedtime: 11:30 pm. Woke up: 6:00 am. Sleep: 6.5 hours. Breakfast: Skipped. ' +
  'Lunch: Spaghetti at 12 pm. Dinner: Not finished. Last snack: Fruit platter at 3 pm. ' +
  'Mood: Stressed. Stress: High at 3 pm. School: 9:00-3:00. Appointment: 4:30.'

describe('describeChildContext', () => {
  it('turns the snapshot into the recentContext string the adapter expects', () => {
    expect(describeChildContext(full)).toBe(FULL_CONTEXT)
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
      'Bedtime',
      'Woke up',
      'Sleep',
      'Breakfast',
      'Lunch',
      'Dinner',
      'Last snack',
      'Mood',
      'Stress',
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

  it('shows the fuller day log from the design under each heading', () => {
    // Mei's Sprint 3 Week 2 review: five lines never filled the panel, so
    // nobody could check it scrolls.
    const labels = Object.fromEntries(
      childContextSections(full).map((section) => [
        section.heading,
        section.rows.map((row) => row.label),
      ])
    )

    expect(labels).toEqual({
      Sleep: ['Last night slept', 'Woke up', 'Total sleep'],
      Food: ['Breakfast', 'Lunch', 'Dinner', 'Last snack'],
      Observations: ['Mood', 'Stress'],
      Events: ['School', 'Next appointment'],
    })
  })

  it('keeps unlogged values as null for the panel to label', () => {
    const rows = childContextSections(empty).flatMap((section) => section.rows)

    expect(rows.every((row) => row.value === null)).toBe(true)
  })

  it('does not change what is sent to the AI', () => {
    expect(describeChildContext(full)).toBe(FULL_CONTEXT)
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
