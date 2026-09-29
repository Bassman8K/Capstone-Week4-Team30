export const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434'

export const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL ?? 'hermes3:3b'

export interface HermesContext {
  childName: string
  age: number
  category: string
  currentSituation: string
  recentContext?: string
  knownTriggers?: string[]
  previousStrategies?: string[]
}

export interface HermesSessionMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface HermesRequest {
  context: HermesContext
  userMessage: string
  sessionContext?: HermesSessionMessage[]
}

export interface HermesResponse {
  possibleContext: string
  suggestedActions: string[]
  followUpQuestion: string
  safetyNotice?: string | null
}