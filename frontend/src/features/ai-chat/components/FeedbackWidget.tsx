import type { HelpfulnessRating } from '../types'

const OPTIONS: Array<{ rating: HelpfulnessRating; label: string; className: string }> = [
  { rating: 'not-helpful', label: 'Not helpful', className: 'bg-red-100 text-red-800' },
  { rating: 'kinda-helpful', label: 'Kinda helpful', className: 'bg-amber-100 text-amber-800' },
  { rating: 'very-helpful', label: 'Very helpful', className: 'bg-green-100 text-green-800' },
]

/**
 * "How was my help?" — the rating row the assistant appends to its advice
 * ("AI - Picking an option" / "AI - Reviewing the advice" frames).
 *
 * Buttons are inert until Sprint 2 wires ratings through to the backend so the
 * assistant can weight future suggestions.
 */
export function FeedbackWidget() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <p className="text-sm text-zinc-900">How was my help?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {OPTIONS.map(({ rating, label, className }) => (
          <span
            key={rating}
            className={`rounded px-2.5 py-1 text-xs font-medium ${className}`}
            data-rating={rating}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
