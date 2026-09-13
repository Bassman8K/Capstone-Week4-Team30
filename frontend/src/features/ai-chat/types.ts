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

export interface ChatMessage {
  id: string
  author: ChatAuthor
  body: string
  /**
   * Rendered as the inline links in the assistant's reply — e.g. "turning
   * tomatoes into soup" / "find a reliable alternative".
   */
  suggestedActions?: string[]
}

/** The three options in the "How was my help?" widget. */
export type HelpfulnessRating = 'not-helpful' | 'kinda-helpful' | 'very-helpful'
