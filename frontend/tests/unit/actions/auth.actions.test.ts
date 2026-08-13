import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCookiesGet, mockRedirect } = vi.hoisted(() => ({
  mockCookiesGet: vi.fn(),
  mockRedirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`)
  }),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: mockCookiesGet })),
}))

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

import { adminAuth } from '@/lib/firebase/admin'
import { getServerSession, requireAuth } from '@/actions/auth.actions'

describe('getServerSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when there is no session cookie', async () => {
    mockCookiesGet.mockReturnValue(undefined)

    await expect(getServerSession()).resolves.toBeNull()
  })

  it('returns null when the session cookie fails verification', async () => {
    mockCookiesGet.mockReturnValue({ value: 'invalid-cookie' })
    vi.mocked(adminAuth.verifySessionCookie).mockRejectedValueOnce(new Error('bad cookie'))

    await expect(getServerSession()).resolves.toBeNull()
  })

  it('returns the decoded session for a valid cookie', async () => {
    mockCookiesGet.mockReturnValue({ value: 'valid-cookie' })
    vi.mocked(adminAuth.verifySessionCookie).mockResolvedValueOnce({ uid: 'user-1' } as never)

    await expect(getServerSession()).resolves.toEqual({ uid: 'user-1' })
  })
})

describe('requireAuth (route guard used by /teams and the rest of (dashboard))', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /auth/signin when there is no session', async () => {
    mockCookiesGet.mockReturnValue(undefined)

    await expect(requireAuth()).rejects.toThrow('NEXT_REDIRECT:/auth/signin')
    expect(mockRedirect).toHaveBeenCalledWith('/auth/signin')
  })

  it('returns the session and does not redirect when authenticated', async () => {
    mockCookiesGet.mockReturnValue({ value: 'valid-cookie' })
    vi.mocked(adminAuth.verifySessionCookie).mockResolvedValueOnce({ uid: 'user-1' } as never)

    await expect(requireAuth()).resolves.toEqual({ uid: 'user-1' })
    expect(mockRedirect).not.toHaveBeenCalled()
  })
})
