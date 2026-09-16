'use client'

import { useState } from 'react'
import type { HelpfulnessRating } from '../types'

const OPTIONS: Array<{ rating: HelpfulnessRating; label: string; className: string }> = [
  {
    rating: 'not-helpful',
    label: 'Not Helpful',
    className: 'bg-red-100 text-red-800 hover:bg-red-200',
  },
  {
    rating: 'kinda-helpful',
    label: 'kinda helpful',
    className: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  },
  {
    rating: 'very-helpful',
    label: 'very helpful',
    className: 'bg-green-100 text-green-800 hover:bg-green-200',
  },
]

/**
 * "How was my help?" — the rating row from the "AI - Picking an option" and
 * "AI - Reviewing the advice" frames, including the acknowledgement the design
 * shows once a rating is given.
 *
 * Ratings are local for now. `onRate` is where Sprint 2 sends them to the
 * backend so the assistant can weight future suggestions.
 */
export function FeedbackWidget({ onRate }: { onRate?: (rating: HelpfulnessRating) => void }) {
  const [rating, setRating] = useState<HelpfulnessRating | null>(null)

  if (rating) {
    return (
      <p className="text-sm text-zinc-600">Understood! I will keep this in mind for the future</p>
    )
  }

  return (
    <div>
      <p className="text-sm text-zinc-900">How was my help?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.rating}
            type="button"
            onClick={() => {
              setRating(option.rating)
              onRate?.(option.rating)
            }}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${option.className}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
