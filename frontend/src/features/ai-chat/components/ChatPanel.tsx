'use client'

import { useState } from 'react'
import { Menu, Send } from 'lucide-react'
import { mockChild, mockChildContext } from '@/features/children/mock'
import { requestSupport } from '../actions/requestSupport'
import type { ChatStatus, ChatTurn } from '../types'
import { AssistantReply } from './AssistantReply'
import { ContextDrawer } from './ContextDrawer'
import { FeedbackWidget } from './FeedbackWidget'
import { MessageBubble } from './MessageBubble'

/**
 * The main AI interaction screen ("Main AI" frame in the Refined Concepts
 * Figma): the carer describes a situation, the assistant replies with context,
 * things to try, and a follow-up question.
 *
 * Responses come from Dev 2's local Hermes adapter via the requestSupport
 * Server Action. A local 3B model takes a few seconds to answer, so the
 * loading state carries real weight here.
 */

let turnCounter = 0
const nextId = () => `turn-${(turnCounter += 1)}`

/**
 * Placeholder until the BA's behaviour contract defines the real category
 * taxonomy (their card confirms Food & Eating Support as the Week 1 scenario).
 */
const CATEGORY = 'general-support'

export function ChatPanel() {
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<ChatStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isSending = status === 'sending'

  async function send(situation: string) {
    const trimmed = situation.trim()
    if (!trimmed || isSending) return

    setTurns((current) => [...current, { id: nextId(), kind: 'user', body: trimmed }])
    setInput('')
    setStatus('sending')
    setErrorMessage(null)

    const result = await requestSupport({
      childName: mockChild.name,
      age: mockChild.age,
      category: CATEGORY,
      currentSituation: trimmed,
      knownTriggers: mockChild.knownTriggers,
      previousStrategies: mockChild.previousStrategies,
    })

    const { data } = result
    if (!result.success || !data) {
      setErrorMessage(result.error ?? 'Something went wrong getting a suggestion.')
      setStatus('error')
      return
    }

    setTurns((current) => [...current, { id: nextId(), kind: 'assistant-reply', response: data }])
    setStatus('idle')
  }

  const lastUserTurn = [...turns].reverse().find((turn) => turn.kind === 'user')

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="flex min-h-[28rem] flex-col overflow-hidden rounded-lg bg-white ring-1 ring-zinc-200">
        <div className="flex items-center justify-between bg-slate-800 px-4 py-2 text-white">
          <span className="text-sm font-medium">Assistant</span>
          <button
            type="button"
            onClick={() => setDrawerOpen((open) => !open)}
            aria-expanded={drawerOpen}
            aria-label={`${drawerOpen ? 'Hide' : 'Show'} ${mockChild.name}'s info`}
            className="rounded p-1 hover:bg-white/10"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-zinc-50 p-4">
          {turns.length === 0 && (
            <p className="text-sm text-zinc-400">
              Describe what&apos;s happening and the assistant will suggest things to try.
            </p>
          )}

          {turns.map((turn) => (
            <div key={turn.id}>
              {turn.kind === 'user' && <MessageBubble author="user">{turn.body}</MessageBubble>}

              {turn.kind === 'assistant-text' && (
                <MessageBubble author="assistant">{turn.body}</MessageBubble>
              )}

              {turn.kind === 'assistant-reply' && (
                <div className="space-y-2">
                  <MessageBubble author="assistant">
                    <AssistantReply response={turn.response} onSelectAction={send} />
                  </MessageBubble>
                  <div className="max-w-[85%] rounded-lg bg-white p-3 ring-1 ring-zinc-200">
                    <FeedbackWidget />
                  </div>
                </div>
              )}
            </div>
          ))}

          {isSending && (
            <p role="status" className="text-sm text-zinc-500">
              Thinking… this can take a few seconds.
            </p>
          )}

          {status === 'error' && (
            <div role="alert" className="space-y-2 text-sm text-red-600">
              <p>{errorMessage ?? 'Something went wrong getting a suggestion.'}</p>
              <button
                type="button"
                onClick={() => lastUserTurn && send(lastUserTurn.body)}
                className="rounded bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void send(input)
          }}
          className="flex items-center gap-2 border-t border-zinc-200 p-3"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask me anything"
            aria-label="Describe what's happening"
            disabled={isSending}
            className="focus:ring-brand-500 flex-1 rounded-full border border-zinc-300 px-4 py-2 text-sm focus:ring-2 focus:outline-none disabled:bg-zinc-50"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            aria-label="Send"
            className="text-brand-700 rounded-full p-2 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="size-5" aria-hidden="true" />
          </button>
        </form>
      </div>

      {drawerOpen && <ContextDrawer childName={mockChild.name} snapshot={mockChildContext} />}
    </div>
  )
}
