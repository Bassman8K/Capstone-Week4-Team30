import { z } from 'zod'
import {
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
  type HermesRequest,
  type HermesResponse,
} from './ollama'
import { HERMES_SYSTEM_PROMPT } from './hermesPrompt'

interface OllamaChatResponse {
  message: {
    content: string
  }
}

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const hermesResponseSchema = z.object({
  possibleContext: z.string().trim().min(1),
  suggestedActions: z.array(z.string().trim().min(1)).min(1),
  followUpQuestion: z.string().trim().min(1),
  safetyNotice: z.string().nullable().optional(),
})

export async function askHermes(
  request: HermesRequest,
): Promise<HermesResponse> {
  const messages: OllamaMessage[] = [
    {
      role: 'system',
      content: HERMES_SYSTEM_PROMPT,
    },
  ]

  // Include only the short-term history supplied by the current chat session.
  // This is not stored or treated as permanent child information.
  if (request.sessionContext?.length) {
    messages.push(
      ...request.sessionContext.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    )
  }

  // Send the current child context and current parent message last,
  // so they take priority over earlier conversation turns.
  messages.push({
    role: 'user',
    content: JSON.stringify({
      context: request.context,
      userMessage: request.userMessage,
    }),
  })

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: 'json',
      messages,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`)
  }

  const data = (await response.json()) as OllamaChatResponse

  const parsedJson: unknown = JSON.parse(data.message.content)
  const validated = hermesResponseSchema.parse(parsedJson)

  return {
    possibleContext: validated.possibleContext,
    suggestedActions: validated.suggestedActions.slice(0, 3),
    followUpQuestion: validated.followUpQuestion,
    safetyNotice: validated.safetyNotice ?? null,
  }
}