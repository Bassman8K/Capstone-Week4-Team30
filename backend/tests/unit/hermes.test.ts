import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../../src/app'
import { askHermes } from '../../src/lib/hermesClient'
import { mockUser, mockVerifyToken } from '../setup'

vi.mock('../../src/lib/hermesClient', () => ({
  askHermes: vi.fn(),
}))

describe('POST /api/hermes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(mockVerifyToken).mockResolvedValue(mockUser)
  })

  it('accepts the frontend support request and returns the Hermes response contract', async () => {
    vi.mocked(askHermes).mockResolvedValue({
      possibleContext: 'Sam may be overwhelmed by the noisy environment.',
      suggestedActions: [
        'Move to a quieter area.',
        'Offer noise-cancelling headphones.',
        'Give Sam time to settle.',
      ],
      followUpQuestion: 'Has anything similar helped Sam before?',
      safetyNotice: null,
    })

    const body = {
      childName: 'Sam',
      age: 7,
      category: 'Sensory',
      currentSituation:
        'Sam is becoming overwhelmed by loud noises in a shopping centre.',
      recentContext: 'Sam slept poorly last night.',
      knownTriggers: ['Loud environments'],
      previousStrategies: ['Noise-cancelling headphones'],
    }

    const response = await request(
      createApp({ verifyToken: mockVerifyToken }),
    )
      .post('/api/hermes')
      .set('Authorization', 'Bearer test-token')
      .send(body)

    expect(response.status).toBe(200)

    expect(response.body).toEqual({
      possibleContext: 'Sam may be overwhelmed by the noisy environment.',
      suggestedActions: [
        'Move to a quieter area.',
        'Offer noise-cancelling headphones.',
        'Give Sam time to settle.',
      ],
      followUpQuestion: 'Has anything similar helped Sam before?',
      safetyNotice: null,
    })

    expect(askHermes).toHaveBeenCalledOnce()
    expect(askHermes).toHaveBeenCalledWith({
      context: body,
      userMessage: body.currentSituation,
      sessionContext: undefined,
    })
  })

  it('passes short-term session context to Hermes', async () => {
    vi.mocked(askHermes).mockResolvedValue({
      possibleContext:
        'The previous conversation suggests Sam was already struggling with noise.',
      suggestedActions: [
        'Move to a quieter area.',
        'Offer the headphones that helped earlier.',
        'Give Sam a short break.',
      ],
      followUpQuestion: 'Has Sam had a chance to rest since the earlier noise?',
      safetyNotice: null,
    })

    const body = {
      childName: 'Sam',
      age: 7,
      category: 'Sensory',
      currentSituation: 'He is still upset. What should I do next?',
      knownTriggers: ['Loud environments'],
      previousStrategies: ['Noise-cancelling headphones'],
      sessionContext: [
        {
          role: 'user',
          content: 'Sam was overwhelmed by loud noises at the shopping centre.',
        },
        {
          role: 'assistant',
          content:
            'Try moving to a quieter area and offer his noise-cancelling headphones.',
        },
      ],
    }

    const response = await request(
      createApp({ verifyToken: mockVerifyToken }),
    )
      .post('/api/hermes')
      .set('Authorization', 'Bearer test-token')
      .send(body)

    expect(response.status).toBe(200)

    expect(askHermes).toHaveBeenCalledWith({
      context: {
        childName: body.childName,
        age: body.age,
        category: body.category,
        currentSituation: body.currentSituation,
        knownTriggers: body.knownTriggers,
        previousStrategies: body.previousStrategies,
      },
      userMessage: body.currentSituation,
      sessionContext: body.sessionContext,
    })
  })

  it('returns 400 when more than four session messages are supplied', async () => {
    const response = await request(
      createApp({ verifyToken: mockVerifyToken }),
    )
      .post('/api/hermes')
      .set('Authorization', 'Bearer test-token')
      .send({
        childName: 'Sam',
        age: 7,
        category: 'Sensory',
        currentSituation: 'What should I do now?',
        sessionContext: [
          { role: 'user', content: 'Message 1' },
          { role: 'assistant', content: 'Message 2' },
          { role: 'user', content: 'Message 3' },
          { role: 'assistant', content: 'Message 4' },
          { role: 'user', content: 'Message 5' },
        ],
      })

    expect(response.status).toBe(400)
    expect(askHermes).not.toHaveBeenCalled()
  })

  it('returns 400 when the frontend request is invalid', async () => {
    const response = await request(
      createApp({ verifyToken: mockVerifyToken }),
    )
      .post('/api/hermes')
      .set('Authorization', 'Bearer test-token')
      .send({
        childName: '',
        age: 7,
        category: 'Sensory',
        currentSituation: '',
      })

    expect(response.status).toBe(400)
    expect(askHermes).not.toHaveBeenCalled()
  })
})