import { childContextSections } from '@/features/children/context'
import type { ChildContextSnapshot } from '@/features/children/types'
import { formatDate } from '@/lib/utils'

/**
 * The "<name>'s Info" panel behind the chat's hamburger menu. Shows what the
 * assistant already knows, so the carer can see why it's suggesting what it is.
 *
 * Laid out per Mei's Sprint 3 "AI Tab - Context Tab" frames: the child and
 * today's date up top, then the context grouped under headings, then the
 * conversation's recent recommendations. It scrolls inside its own height when
 * there's more than fits.
 */
export function ContextDrawer({
  childName,
  snapshot,
  recentRecommendations = [],
  className = '',
}: {
  childName: string
  snapshot: ChildContextSnapshot
  /**
   * Suggestions from this conversation, newest first. Chat history isn't saved
   * yet, so this starts empty on every visit.
   */
  recentRecommendations?: string[]
  /** Positioning and height from the parent — it decides overlay vs. side column. */
  className?: string
}) {
  return (
    <aside
      aria-label={`${childName}'s info`}
      className={`overflow-y-auto rounded-lg bg-slate-700 p-4 text-white ${className}`}
    >
      <div className="flex items-baseline justify-between gap-2 border-b border-white/20 pb-2">
        <h2 className="text-base font-semibold">{childName}&apos;s Info</h2>
        <span className="text-xs text-white/70">{formatDate(new Date())}</span>
      </div>

      <dl className="mt-3 space-y-3 text-sm">
        {childContextSections(snapshot).map((section) => (
          <div key={section.heading}>
            <dt className="font-semibold">{section.heading}</dt>
            {section.rows.map(({ label, value }) => (
              <dd key={label} className="mt-1 pl-3">
                {label}:{' '}
                {value ?? <span className="text-white/60 italic">Not logged</span>}
              </dd>
            ))}
          </div>
        ))}

        <div>
          <dt className="font-semibold">Recent recommendations</dt>
          {recentRecommendations.length === 0 ? (
            <dd className="mt-1 pl-3 text-white/60 italic">None yet</dd>
          ) : (
            recentRecommendations.map((recommendation) => (
              <dd key={recommendation} className="mt-1 pl-3">
                {recommendation}
              </dd>
            ))
          )}
        </div>
      </dl>
    </aside>
  )
}
