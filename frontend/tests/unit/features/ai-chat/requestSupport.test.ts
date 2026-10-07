import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/actions/auth.actions', () => ({ requireAuth: vi.fn() }))

import { requestSupport } from '@/features/ai-chat/actions/requestSupport'

const request = {
  childName: 'Ben',
  age: 8,
  category: 'general-support',
  currentSituation: 'Ben is upset after school',
}

function adapterReturns(body: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
  )
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('requestSupport', () => {
  it('accepts a reply that asks a question instead of suggesting actions', async () => {
    // Hermes returns suggestedActions: [] on purpose when it needs more
    // detail. This used to fail validation and surface as "Couldn't reach
    // the assistant".
    adapterReturns({
      possibleContext: 'Ben is upset after school.',
      suggestedActions: [],
      followUpQuestion: 'What happened just before this started?',
      safetyNotice: null,
    })

    const result = await requestSupport(request)

    expect(result).toEqual({
      success: true,
      data: {
        possibleContext: 'Ben is upset after school.',
        suggestedActions: [],
        followUpQuestion: 'What happened just before this started?',
        safetyNotice: null,
      },
    })
  })

  it('forwards recentContext to the adapter unchanged', async () => {
    adapterReturns({
      possibleContext: 'x',
      suggestedActions: ['y'],
      followUpQuestion: 'z',
    })

    await requestSupport({ ...request, recentContext: 'Breakfast: Skipped.' })

    const [, init] = vi.mocked(fetch).mock.calls[0] ?? []
    expect(JSON.parse(String(init?.body))).toMatchObject({
      recentContext: 'Breakfast: Skipped.',
    })
  })

  it('does not blame the connection when the reply is malformed', async () => {
    adapterReturns({ solution: 'wrong field names' })

    const result = await requestSupport(request)

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/couldn't be read/i)
    expect(result.error).not.toMatch(/couldn't reach/i)
  })

  it('reports an unreachable adapter as a connection problem', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))

    const result = await requestSupport(request)

    expect(result.error).toMatch(/couldn't reach the assistant/i)
  })
})
