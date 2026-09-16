import type { ReactNode } from 'react'

/**
 * One turn in the conversation. Matches the "Main AI" frame: carer messages
 * sit right in a dark bubble labelled "Me", assistant messages sit left in a
 * light bubble labelled "AI".
 */
export function MessageBubble({
  author,
  children,
}: {
  author: 'user' | 'assistant'
  children: ReactNode
}) {
  const isUser = author === 'user'

  return (
    <div className={isUser ? 'flex flex-col items-end' : 'flex flex-col items-start'}>
      <p className="mb-1 text-xs text-zinc-400">{isUser ? 'Me' : 'AI'}</p>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser ? 'bg-slate-800 text-white' : 'bg-white text-zinc-900 ring-1 ring-zinc-200'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
