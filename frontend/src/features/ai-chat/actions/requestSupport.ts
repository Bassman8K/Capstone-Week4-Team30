'use server'

import { z } from 'zod'
import { requireAuth } from '@/actions/auth.actions'
import type { ActionResult } from '@/types'
import { requestSupport as mockRequestSupport } from '../mock'
import type { SupportRequest, SupportResponse } from '../types'

/**
 * Sends a situation to the local Hermes adapter (Dev 2's service) and returns
 * the structured recommendation.
 *
 * The call goes through the server rather than straight from the browser, so
 * the adapter's address stays server-side and we don't depend on its CORS
 * config. Swapping the local adapter for a deployed endpoint later is a change
 * to ADAPTER_URL only.
 */

/** Dev 2's adapter default — see docs/HERMES-ADAPTER-INTEGRATION.md. */
const ADAPTER_URL = process.env.HERMES_ADAPTER_URL ?? 'http://localhost:8787/api/hermes'

/**
 * Escape hatch for anyone working on the frontend without Ollama installed
 * (UX review, for instance). Off unless explicitly set.
 */
const USE_MOCK = process.env.USE_MOCK_ASSISTANT === 'true'

/**
 * Hermes takes several seconds on a local 3B model — 5s was typical in
 * testing. Give it room, but don't leave the user hanging forever.
 */
const TIMEOUT_MS = 30_000

const requestSchema = z.object({
  childName: z.string().trim().min(1),
  age: z.number().nonnegative(),
  category: z.string().trim().min(1),
  currentSituation: z.string().trim().min(1, 'Describe what is happening first.'),
  recentContext: z.string().trim().min(1).optional(),
  knownTriggers: z.array(z.string().trim().min(1)).optional(),
  previousStrategies: z.array(z.string().trim().min(1)).optional(),
})

/** Mirrors what the adapter returns (backend/src/lib/hermesClient.ts). */
const responseSchema = z.object({
  possibleContext: z.string().trim().min(1),
  suggestedActions: z.array(z.string().trim().min(1)).min(1),
  followUpQuestion: z.string().trim().min(1),
  safetyNotice: z.string().nullable().optional(),
})

export async function requestSupport(
  input: SupportRequest
): Promise<ActionResult<SupportResponse>> {
  await requireAuth()

  const parsed = requestSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request.' }
  }

  if (USE_MOCK) {
    return { success: true, data: await mockRequestSupport(parsed.data) }
  }

  try {
    const response = await fetch(ADAPTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!response.ok) {
      // The adapter returns RFC 9457 problem details; its `detail` is safe to
      // show, but fall back to something generic if the shape surprises us.
      const problem: unknown = await response.json().catch(() => null)
      const detail =
        problem && typeof problem === 'object' && 'detail' in problem
          ? String((problem as { detail: unknown }).detail)
          : null

      return {
        success: false,
        error: detail ?? "The assistant couldn't answer just now. Please try again.",
      }
    }

    const data = responseSchema.parse(await response.json())

    return {
      success: true,
      data: {
        possibleContext: data.possibleContext,
        suggestedActions: data.suggestedActions,
        followUpQuestion: data.followUpQuestion,
        safetyNotice: data.safetyNotice ?? null,
      },
    }
  } catch (error) {
    // Most likely: adapter not running, Ollama not running, or a timeout.
    console.error('[ai-chat] assistant request failed', error)

    const timedOut = error instanceof Error && error.name === 'TimeoutError'

    return {
      success: false,
      error: timedOut
        ? 'The assistant took too long to respond. Please try again.'
        : "Couldn't reach the assistant. Check that the local AI service is running.",
    }
  }
}
