import type { ReactNode } from 'react'

/**
 * The standard card the dashboard is built from — daily summary, "What's
 * happening?", Weekly At A Glance, Food, Recommendations all use this shape
 * ("Dashboard" frame in the Refined Concepts Figma).
 */
export function DashboardCard({
  title,
  href,
  children,
}: {
  title?: string
  /** Renders a chevron affordance when the card drills into another screen. */
  href?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4">
      {title && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          {href && <span className="text-xs text-zinc-400">→</span>}
        </div>
      )}
      <div className="text-sm text-zinc-600">{children}</div>
    </section>
  )
}
