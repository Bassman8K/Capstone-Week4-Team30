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
const ADAPTER_URL =
  process.env.HERMES_ADAPTER_URL ?? 'http://localhost:8787/api/hermes'

/**
 * Escape hatch for anyone working on the frontend without Ollama installed
 * (UX review, for instance). Off unless explicitly set.
 */
const USE_MOCK = process.env.USE_MOCK_ASSISTANT === 'true'

/**
 * Hermes usually answers in 3-8 seconds, but on a slower or mis-configured
 * machine replies have taken 27-40s (HERMES-PROTOTYPE-FINDINGS, Sprint 3
 * tracing). 30s cut those off as "took too long", so allow a minute.
 */
const TIMEOUT_MS = 60_000

const sessionMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1),
})

const requestSchema = z.object({
  childName: z.string().trim().min(1),
  age: z.number().nonnegative(),
  category: z.string().trim().min(1),
  currentSituation: z
    .string()
    .trim()
    .min(1, 'Describe what is happening first.'),
  recentContext: z.string().trim().min(1).optional(),
  knownTriggers: z.array(z.string().trim().min(1)).optional(),
  previousStrategies: z.array(z.string().trim().min(1)).optional(),
  sessionContext: z.array(sessionMessageSchema).max(4).optional(),
})

/** Mirrors what the adapter returns (backend/src/lib/hermesClient.ts). */
const responseSchema = z.object({
  possibleContext: z.string().trim().min(1),
  // Empty on purpose when Hermes needs more detail first: it asks the
  // followUpQuestion instead of guessing. Requiring at least one action
  // rejected those replies and showed "Couldn't reach the assistant".
  suggestedActions: z.array(z.string().trim().min(1)),
  followUpQuestion: z.string().trim().min(1),
  safetyNotice: z.string().nullable().optional(),
})

export async function requestSupport(
  input: SupportRequest
): Promise<ActionResult<SupportResponse>> {
  await requireAuth()

  const parsed = requestSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid request.',
    }
  }

  if (USE_MOCK) {
    return {
      success: true,
      data: await mockRequestSupport(parsed.data),
    }
  }

  try {
    const response = await fetch(ADAPTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!response.ok) {
      const problem: unknown = await response.json().catch(() => null)

      const detail =
        problem &&
        typeof problem === 'object' &&
        'detail' in problem
          ? String((problem as { detail: unknown }).detail)
          : null

      return {
        success: false,
        error:
          detail ??
          "The assistant couldn't answer just now. Please try again.",
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
    console.error('[ai-chat] assistant request failed', error)

    // Reached the adapter, but the reply wasn't the shape we expect — not a
    // connection problem, so don't tell the carer the service is down.
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "The assistant's reply couldn't be read. Please try again.",
      }
    }

    const timedOut =
      error instanceof Error && error.name === 'TimeoutError'

    return {
      success: false,
      error: timedOut
        ? 'The assistant took too long to respond. Please try again.'
        : "Couldn't reach the assistant. Check that the local AI service is running.",
    }
  }
}
