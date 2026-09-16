/**
 * What the frontend sends to the backend assistant endpoint, and what comes
 * back. These mirror `OllamaSupportRequest` / `OllamaSupportResponse` in
 * `backend/src/lib/ollama.ts` — if you change one, change the other. (Worth
 * moving to a shared workspace package once a second consumer appears.)
 */
export interface SupportRequest {
  childName: string
  age: number
  category: string
  currentSituation: string
  recentContext?: string
  knownTriggers?: string[]
  previousStrategies?: string[]
}

export interface SupportResponse {
  possibleContext: string
  suggestedActions: string[]
  followUpQuestion: string
}

export type ChatAuthor = 'user' | 'assistant'

/**
 * One turn in the conversation. Assistant turns are either a structured
 * reply (context + suggestions + follow-up) or plain text, so the UI knows
 * which to render without inspecting the body.
 */
export type ChatTurn =
  | { id: string; kind: 'user'; body: string }
  | { id: string; kind: 'assistant-text'; body: string }
  | { id: string; kind: 'assistant-reply'; response: SupportResponse }

/** Where a request is up to — drives the loading and error states. */
export type ChatStatus = 'idle' | 'sending' | 'error'

/** The three options in the "How was my help?" widget. */
export type HelpfulnessRating = 'not-helpful' | 'kinda-helpful' | 'very-helpful'
