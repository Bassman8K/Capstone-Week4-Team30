import type { SupportRequest, SupportResponse } from './types'

/**
 * Stand-in for the real assistant while DEV 2 builds the Hermes/Ollama agent.
 *
 * The signature is already the production contract, so swapping this for the
 * real thing is a one-line change at the call site — replace the body with a
 * fetch to the backend endpoint that wraps `backend/src/lib/ollama.ts`.
 *
 * `suggestedActions` are deliberately short phrases: the design renders them
 * inline inside the sentence ("You can try <action> or <action>"), not as a
 * list.
 *
 * Copy is support-only and non-diagnostic — it suggests things a carer might
 * try and never asserts a cause or a clinical claim. The BA's AI behaviour
 * contract will formalise those guardrails.
 */

const FOOD_KEYWORDS = ['eat', 'eating', 'food', 'meal', 'dinner', 'lunch', 'breakfast', 'snack']

const FOOD_RESPONSE: SupportResponse = {
  possibleContext:
    'This often comes down to how a food feels rather than the food itself — texture, temperature, or a change in how it was prepared.',
  suggestedActions: ['turning it into a soup', 'offering a familiar alternative'],
  followUpQuestion: 'Was anything different about how it was served today?',
}

const GENERAL_RESPONSE: SupportResponse = {
  possibleContext:
    'Shifts like this often trace back to something earlier in the day — a short night, a change in routine, or a build-up of noise and activity.',
  suggestedActions: ['some quiet time before talking it through', 'checking today’s logs'],
  followUpQuestion: 'Had anything changed in the routine today?',
}

/** How long the mock "thinks" for, so the loading state is actually visible. */
const MOCK_DELAY_MS = 500

export async function requestSupport(
  request: SupportRequest,
  { delayMs = MOCK_DELAY_MS }: { delayMs?: number } = {}
): Promise<SupportResponse> {
  if (!request.currentSituation.trim()) {
    throw new Error('currentSituation is required')
  }

  await new Promise((resolve) => setTimeout(resolve, delayMs))

  const situation = request.currentSituation.toLowerCase()
  const isFoodRelated = FOOD_KEYWORDS.some((keyword) => situation.includes(keyword))

  return isFoodRelated ? FOOD_RESPONSE : GENERAL_RESPONSE
}
