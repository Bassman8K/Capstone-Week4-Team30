import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { LogType } from '../types'

/** One tappable card on the /log screen. */
export function LogTypeCard({ logType }: { logType: LogType }) {
  return (
    <Link
      href={`/log/${logType.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50"
    >
      <span>
        <span className="block text-sm font-semibold text-zinc-900">{logType.label}</span>
        <span className="mt-0.5 block text-xs text-zinc-500">{logType.description}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
    </Link>
  )
}
