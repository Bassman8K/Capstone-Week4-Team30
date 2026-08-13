import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { TeamMemberCard } from '@/features/team/components/TeamMemberCard'
import { TEAM_NAME, teamMembers } from '@/features/team/data'

export const metadata: Metadata = {
  title: 'Team',
}

export default function TeamsPage() {
  return (
    <div>
      <PageHeader title={TEAM_NAME} />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {teamMembers.map((member) => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  )
}
