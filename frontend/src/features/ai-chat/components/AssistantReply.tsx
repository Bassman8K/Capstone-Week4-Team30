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

      {/*
        One suggestion per line, left-aligned, per the "Main AI" frame (Mei's
        Sprint 3 Week 2 review). Buttons centre their text by default, so a
        wrapped suggestion used to come out centred — hence text-left.
      */}
      {response.suggestedActions.length > 0 && (
        <div className="space-y-1">
          <p>You can try</p>
          {response.suggestedActions.map((action, index) => (
            <Fragment key={action}>
              {index > 0 && <p className="text-zinc-500">or</p>}
              <button
                type="button"
                onClick={() => onSelectAction?.(action)}
                className="text-brand-700 hover:text-brand-800 block text-left underline underline-offset-2"
              >
                {action}
              </button>
            </Fragment>
          ))}
        </div>
      )}

      <p className="text-zinc-600 italic">
        {response.followUpQuestion}
      </p>
    </div>
  )
}