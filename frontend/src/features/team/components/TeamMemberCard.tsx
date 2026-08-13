import Image from 'next/image'
import { UserRound } from 'lucide-react'
import type { TeamMember } from '../types'

export function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-zinc-200 bg-white p-5 text-center shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-zinc-200">
        {member.photoUrl ? (
          <Image
            src={member.photoUrl}
            alt={member.name}
            width={64}
            height={64}
            className="h-full w-full object-cover"
          />
        ) : (
          <UserRound className="size-8 text-zinc-400" aria-hidden="true" />
        )}
      </div>

      <p className="mt-3 text-sm font-semibold text-zinc-900">{member.name}</p>
      <span className="bg-brand-100 text-brand-700 mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
        {member.role}
      </span>
      <p className="mt-2 text-xs text-zinc-500">{member.blurb}</p>
    </div>
  )
}
