import { Fragment } from 'react'
import type { SupportResponse } from '../types'

function shouldShowContext(possibleContext: string): boolean {
  const context = possibleContext.trim()

  const repeatedProfilePrefixes = [
    'Recent context:',
    'Known triggers:',
    'Previously tried strategies:',
  ]

  if (context === 'No additional context provided.') {
    return false
  }

  return !repeatedProfilePrefixes.some((prefix) =>
    context.startsWith(prefix),
  )
}

/**
 * Renders a structured assistant response.
 *
 * Routine profile/context summaries are kept for Hermes internally but are
 * not repeated to the caregiver on every reply. Exceptional context, such as
 * a child-profile conflict, can still be shown.
 */
export function AssistantReply({
  response,
  onSelectAction,
}: {
  response: SupportResponse
  onSelectAction?: (action: string) => void
}) {
  const showContext = shouldShowContext(response.possibleContext)

  return (
    <div className="space-y-2">
      {response.safetyNotice && (
        <p
          role="alert"
          className="rounded border border-amber-300 bg-amber-50 px-2.5 py-2 text-amber-900"
        >
          {response.safetyNotice}
        </p>
      )}

      {showContext && <p>{response.possibleContext}</p>}

      {response.suggestedActions.length > 0 && (
        <p>
          You can try{' '}
          {response.suggestedActions.map((action, index) => (
            <Fragment key={action}>
              {index > 0 && ' or '}
              <button
                type="button"
                onClick={() => onSelectAction?.(action)}
                className="text-brand-700 hover:text-brand-800 underline underline-offset-2"
              >
                {action}
              </button>
            </Fragment>
          ))}
          .
        </p>
      )}

      <p className="text-zinc-600 italic">
        {response.followUpQuestion}
      </p>
    </div>
  )
}