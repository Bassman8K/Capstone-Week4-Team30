import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TeamMemberCard } from '@/features/team/components/TeamMemberCard'
import { TEAM_NAME, teamMembers } from '@/features/team/data'
import type { TeamRole } from '@/features/team/types'

describe('teamMembers data', () => {
  it('has a team name', () => {
    expect(TEAM_NAME.length).toBeGreaterThan(0)
  })

  it('includes one member for each required role', () => {
    const roles = teamMembers.map((m) => m.role)
    const required: TeamRole[] = ['PM', 'BA', 'UX', 'Dev']
    for (const role of required) {
      expect(roles).toContain(role)
    }
  })

  it('gives every member a name, role, and blurb', () => {
    for (const member of teamMembers) {
      expect(member.name.length).toBeGreaterThan(0)
      expect(member.role.length).toBeGreaterThan(0)
      expect(member.blurb.length).toBeGreaterThan(0)
    }
  })
})

describe('TeamMemberCard', () => {
  it('renders the name, role, and blurb', () => {
    render(
      <TeamMemberCard
        member={{ id: 'dev', name: 'Jonathan', role: 'Dev', blurb: 'Built this page.' }}
      />
    )

    expect(screen.getByText('Jonathan')).toBeInTheDocument()
    expect(screen.getByText('Dev')).toBeInTheDocument()
    expect(screen.getByText('Built this page.')).toBeInTheDocument()
  })

  it('falls back to a placeholder avatar icon when there is no photo', () => {
    const { container } = render(
      <TeamMemberCard member={{ id: 'pm', name: 'Bailey', role: 'PM', blurb: 'Runs standups.' }} />
    )

    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders a photo instead of the placeholder icon when photoUrl is set', () => {
    const { container } = render(
      <TeamMemberCard
        member={{
          id: 'ux',
          name: 'Mei',
          role: 'UX',
          blurb: 'Designs the mockups.',
          photoUrl: '/team/mei.jpg',
        }}
      />
    )

    expect(container.querySelector('img')).toBeInTheDocument()
  })
})
