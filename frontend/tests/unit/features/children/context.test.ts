import { describe, it, expect } from 'vitest'
import { childContextEntries, describeChildContext } from '@/features/children/context'
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
