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

const hermesResponseSchema = z.object({
  possibleContext: z.string().trim().min(1),
  suggestedActions: z.array(z.string().trim().min(1)).min(1),
  followUpQuestion: z.string().trim().min(1),
  safetyNotice: z.string().nullable().optional(),
})

export async function askHermes(request: HermesRequest): Promise<HermesResponse> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: 'json',
      messages: [
        {
          role: 'system',
          content: HERMES_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: JSON.stringify(request),
        },
      ],
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