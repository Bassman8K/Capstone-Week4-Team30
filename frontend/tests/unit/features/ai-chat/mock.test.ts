import { describe, it, expect } from 'vitest'
import { requestSupport } from '@/features/ai-chat/mock'
import type { SupportRequest } from '@/features/ai-chat/types'

const baseRequest: SupportRequest = {
  childName: 'Ben',
  age: 8,
  category: 'general-support',
  currentSituation: 'Something happened today',
}

describe('requestSupport (mock assistant)', () => {
  it('returns all three parts of the contract', async () => {
    const response = await requestSupport(baseRequest, { delayMs: 0 })

    expect(response.possibleContext.length).toBeGreaterThan(0)
    expect(response.suggestedActions.length).toBeGreaterThan(0)
    expect(response.followUpQuestion.length).toBeGreaterThan(0)
  })

  it('returns the food scenario when the situation mentions eating', async () => {
    const response = await requestSupport(
      { ...baseRequest, currentSituation: "Ben isn't eating his tomatoes" },
      { delayMs: 0 }
    )

    expect(response.possibleContext).toContain('texture')
  })

  it('falls back to general support for unrelated situations', async () => {
    const response = await requestSupport(
      { ...baseRequest, currentSituation: 'He seemed upset after school' },
      { delayMs: 0 }
    )

    expect(response.possibleContext).not.toContain('texture')
  })

  it('rejects an empty situation', async () => {
    await expect(
      requestSupport({ ...baseRequest, currentSituation: '   ' }, { delayMs: 0 })
    ).rejects.toThrow()
  })
})
