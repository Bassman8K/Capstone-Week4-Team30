import type { ReactNode } from 'react'

/**
 * Layout for the AI chat screen: a scrolling message area with a composer
 * pinned to the bottom ("Main AI" frame in the Refined Concepts Figma).
 *
 * Presentation only — wiring the composer to the backend assistant endpoint
 * is Sprint 2 work.
 */
export function ChatShell({ children, composer }: { children: ReactNode; composer?: ReactNode }) {
  return (
    <div className="flex h-full min-h-[24rem] flex-col rounded-lg border border-zinc-200 bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">{children}</div>
      <div className="border-t border-zinc-200 p-3">
        {composer ?? (
          <div className="flex items-center justify-between rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-400">
            Ask me anything
          </div>
        )}
      </div>
    </div>
  )
}
