import type { ReactNode } from 'react'

/**
 * Marks a page or block that exists as routing/layout scaffolding only — the
 * real feature isn't built yet.
 *
 * Grep for `ScaffoldNotice` to find everything still outstanding. Delete each
 * one as its screen gets implemented.
 */
export function ScaffoldNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-6">
      <p className="text-xs font-medium tracking-wide text-zinc-400 uppercase">Scaffold</p>
      <div className="mt-2 text-sm text-zinc-600">{children}</div>
    </div>
  )
}
