import { describe, it, expect } from 'vitest'
import { loginSchema, signupSchema } from '@/lib/validations/auth'

// Edge cases from the Task 2 (UX) mockup: empty fields and malformed input must
// fail validation so the signin/signup pages can show the "Missing details" banner.
describe('loginSchema edge cases', () => {
  it('rejects an empty email and empty password', () => {
    const result = loginSchema.safeParse({ email: '', password: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a malformed email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'something' })
    expect(result.success).toBe(false)
  })

  it('rejects a missing password with a valid email', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' })
    expect(result.success).toBe(false)
  })

  it('accepts a valid email and non-empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'anything' })
    expect(result.success).toBe(true)
  })
})

describe('signupSchema edge cases', () => {
  const valid = {
    displayName: 'Jonathan',
    email: 'user@example.com',
    password: 'Password1',
    confirmPassword: 'Password1',
  }

  it('rejects all fields empty', () => {
    const result = signupSchema.safeParse({
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a password without an uppercase letter or number', () => {
    const result = signupSchema.safeParse({
      ...valid,
      password: 'password',
      confirmPassword: 'password',
    })
    expect(result.success).toBe(false)
  })

  it('rejects mismatched password and confirm password', () => {
    const result = signupSchema.safeParse({ ...valid, confirmPassword: 'Different1' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('confirmPassword')
    }
  })

  it('accepts a fully valid signup payload', () => {
    const result = signupSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })
})
