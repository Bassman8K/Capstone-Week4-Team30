'use client'

import { useState } from 'react'
import { Menu, Send } from 'lucide-react'
import { describeChildContext } from '@/features/children/context'
import { mockChild, mockChildContext } from '@/features/children/mock'
import { requestSupport } from '../actions/requestSupport'
import type { ChatStatus, ChatTurn, SessionMessage } from '../types'
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

/** How much of the conversation Hermes keeps for continuity (its cap is 4). */
const SESSION_CONTEXT_TURNS = 4

function toSessionMessage(turn: ChatTurn): SessionMessage {
  if (turn.kind === 'user') {
    return { role: 'user', content: turn.body }
  }

  if (turn.kind === 'assistant-text') {
    return { role: 'assistant', content: turn.body }
  }

  return {
    role: 'assistant',
    content: [
      turn.response.possibleContext,
      ...turn.response.suggestedActions,
      turn.response.followUpQuestion,
    ].join(' '),
  }
}

/**
 * The most recent carer message together with the conversation that came
 * before it — what a retry needs to re-ask without repeating itself.
 */
function findLastPrompt(turns: ChatTurn[]): { body: string; history: ChatTurn[] } | null {
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index]
    if (turn?.kind === 'user') {
      return { body: turn.body, history: turns.slice(0, index) }
    }
  }
  return null
}

export function ChatPanel() {
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<ChatStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isSending = status === 'sending'

  /**
   * Asks the assistant about `situation`. `history` is the conversation as it
   * stood *before* that prompt — the prompt itself travels in
   * `currentSituation`, so repeating it in the history would send it twice.
   */
  async function ask(situation: string, history: ChatTurn[]) {
    setStatus('sending')
    setErrorMessage(null)

    const result = await requestSupport({
      childName: mockChild.name,
      age: mockChild.age,
      category: CATEGORY,
      currentSituation: situation,
      // What the carer can see in the info panel — previously never sent.
      recentContext: describeChildContext(mockChildContext),
      knownTriggers: mockChild.knownTriggers,
      previousStrategies: mockChild.previousStrategies,
      sessionContext: history.slice(-SESSION_CONTEXT_TURNS).map(toSessionMessage),
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

  /** A new prompt from the carer: show their message, then ask. */
  async function send(situation: string) {
    const trimmed = situation.trim()
    if (!trimmed || isSending) return

    const history = turns
    setTurns((current) => [...current, { id: nextId(), kind: 'user', body: trimmed }])
    setInput('')

    await ask(trimmed, history)
  }

  /**
   * Re-asks the last prompt after a failure. The carer's message is already on
   * screen, so this deliberately doesn't add it again — Week 2 UX testing found
   * retrying duplicating their prompt in the conversation.
   */
  async function retry() {
    if (isSending) return

    const prompt = findLastPrompt(turns)
    if (!prompt) return

    await ask(prompt.body, prompt.history)
  }

  const canRetry = findLastPrompt(turns) !== null

  return (
    <div className="relative grid gap-4 lg:grid-cols-[2fr_1fr]">
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

          {/*
            A typing indicator in the assistant's own bubble, per the "Loading
            state - Main Page" frame, rather than a line of grey text. The
            wait is a real 5-8 seconds on a local 3B model, so the visible
            text stays available to screen readers.
          */}
          {isSending && (
            <div role="status">
              <MessageBubble author="assistant">
                <span className="flex items-center gap-1 py-1" aria-hidden="true">
                  <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-zinc-400" />
                </span>
                <span className="sr-only">Thinking… this can take a few seconds.</span>
              </MessageBubble>
            </div>
          )}

          {status === 'error' && (
            <div role="alert" className="space-y-2">
              <p className="text-sm text-red-600">
                {errorMessage ?? 'Something went wrong getting a suggestion.'}
              </p>

              {canRetry && (
                <button
                  type="button"
                  onClick={() => void retry()}
                  className="rounded-full bg-red-100 px-4 py-1.5 text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Retry
                </button>
              )}
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

      {drawerOpen && (
        <>
          {/*
            Below lg the panel sits *over* the conversation, as in the "updated
            context sidebar" frame. It used to drop into the next grid row,
            which on a phone pushed it below the chat — the behaviour UX
            testing flagged. The scrim gives a way back out.
          */}
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label={`Close ${mockChild.name}'s info`}
            className="absolute inset-0 z-10 cursor-default bg-slate-900/40 lg:hidden"
          />

          <ContextDrawer
            childName={mockChild.name}
            snapshot={mockChildContext}
            className="absolute inset-y-0 right-0 z-20 w-4/5 max-w-xs overflow-y-auto rounded-r-none lg:static lg:w-auto lg:max-w-none lg:rounded-r-lg"
          />
        </>
      )}
    </div>
  )
}
