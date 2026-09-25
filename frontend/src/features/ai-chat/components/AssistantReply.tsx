import { Fragment } from 'react'
import type { SupportResponse } from '../types'

/**
 * A structured assistant reply, rendered the way the "Main AI" frame shows it:
 * the context as prose, then the suggestions as inline links inside the
 * sentence — "You can try <action> or <action>" — rather than a list.
 */
export function AssistantReply({
  response,
  onSelectAction,
}: {
  response: SupportResponse
  onSelectAction?: (action: string) => void
}) {
  return (
    <div className="space-y-2">
      {/*
        Shown above the advice, not among it — when the agent flags something
        needing more than everyday support, that shouldn't be one bullet
        competing with meal tips.
      */}
      {response.safetyNotice && (
        <p
          role="alert"
          className="rounded border border-amber-300 bg-amber-50 px-2.5 py-2 text-amber-900"
        >
          {response.safetyNotice}
        </p>
      )}

      <p>{response.possibleContext}</p>

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

      <p className="text-zinc-600 italic">{response.followUpQuestion}</p>
    </div>
  )
}
