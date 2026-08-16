import type { TeamMember } from './types'

// ─────────────────────────────────────────────────────────────────────────
// TEAM ROSTER — this is the only file you need to edit to add yourself.
// See docs/ADD-YOURSELF-TO-TEAM-PAGE.md for a no-coding-required walkthrough
// using GitHub's website.
//
// Per person, fill in:
//   name:     your real name, in quotes                    e.g. 'Mei Ann Goh'
//   role:     one of 'PM' | 'BA' | 'UX' | 'Dev'  (keep the quotes)
//   blurb:    one or two sentences about you, in quotes
//   photoUrl: '/team/<your-file-name>' — upload your photo to
//             frontend/public/team/ first, then point this at it.
//             Leave this line out entirely if you don't have a photo yet —
//             a placeholder icon shows instead.
//
// To add a new person (e.g. a second Dev), copy one whole { ... } block,
// paste it below the last one, give it a unique id, and fill in the fields.
// Every block needs a comma after its closing }.
// ─────────────────────────────────────────────────────────────────────────
export const TEAM_NAME = 'Team 30'

export const teamMembers: TeamMember[] = [
  {
    id: 'pm',
    name: 'Bailey Dwyer',
    role: 'PM',
    blurb: 'I cant hit my protein.',
    photoUrl: '/team/cropped_bailey_d_ford_focus-3.jpg',
  },
  {
    id: 'ba',
    name: '[Insert Name]',
    role: 'BA',
    blurb: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
  },
  {
    id: 'ux',
    name: '[Insert Name]',
    role: 'UX',
    blurb: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
  },
  {
    id: 'dev',
    name: '[Jonathan Edwin]',
    role: 'Dev',
    blurb: 'Aspiring developer who loves music and trains.',
    photoUrl: '/team/jonathan.jpg'
  },
]
