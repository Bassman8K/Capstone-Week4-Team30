import { afterEach, describe, expect, it, vi } from 'vitest'
import { askHermes } from '../../src/lib/hermesClient'
import type { HermesRequest } from '../../src/lib/ollama'

// Rule-based branches answer without calling the model; the rest go to
// Ollama. Stub fetch so we can tell which path a message took.
function stubModel() {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        message: {
          content: JSON.stringify({
            possibleContext: 'Texture can make a meal hard to start.',
            suggestedActions: ['Offer a familiar side alongside the meal.'],
            followUpQuestion: 'Has anything about dinner changed recently?',
            safetyNotice: null,
          }),
        },
      }),
      { status: 200 },
    ),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function ask(currentSituation: string): Promise<unknown> {
  const request: HermesRequest = {
    context: {
      childName: 'Ben',
      age: 8,
      category: 'general-support',
      currentSituation,
      knownTriggers: ['Loud environments'],
    },
    userMessage: currentSituation,
  }
  return askHermes(request)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('askHermes — neutral observations', () => {
  it('still treats a plain observation as needing a question first', async () => {
    const fetchMock = stubModel()

    const reply = (await ask('Ben ate pasta today')) as { suggestedActions: string[] }

    expect(fetchMock).not.toHaveBeenCalled()
    expect(reply.suggestedActions).toEqual([])
  })

  it.each([
    "Ben isn't eating his dinner and I don't know why",
    'Ben isn’t eating his dinner and I don’t know why',
    'Ben did not eat his lunch today',
    'Ben skipped breakfast today',
  ])('sends a described problem to the model for advice: %s', async (message) => {
    // The demo scenario was misread as a neutral observation because
    // "eating" counted as an observation and negations weren't concerns.
    const fetchMock = stubModel()

    await ask(message)

    expect(fetchMock).toHaveBeenCalledOnce()
  })
})

describe('askHermes — diagnosis requests', () => {
  it.each([
    'Does Ben have ADHD because he cannot sit still?',
    'Is Ben autistic?',
    'Does he have ADHD?',
  ])('declines to diagnose: %s', async (message) => {
    const fetchMock = stubModel()

    const reply = (await ask(message)) as { safetyNotice: string | null }

    expect(fetchMock).not.toHaveBeenCalled()
    expect(reply.safetyNotice).toMatch(/cannot diagnose/i)
  })
})
