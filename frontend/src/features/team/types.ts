export type TeamRole = 'PM' | 'BA' | 'UX' | 'Dev'

export interface TeamMember {
  id: string
  name: string
  role: TeamRole
  blurb: string
  photoUrl?: string
}
