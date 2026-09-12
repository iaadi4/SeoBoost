import { describe, expect, it } from 'vitest'
import {
  PASSWORD_MIN_LENGTH,
  mapAuthError,
  passwordIssue,
  passwordsMatchIssue,
} from '@/lib/auth-ui'

describe('password rules', () => {
  it('matches the signup minimum of 8 characters', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8)
    expect(passwordIssue('short')).toBe('Password must be at least 8 characters.')
    expect(passwordIssue('longenough')).toBeNull()
  })

  it('requires the confirmation to match', () => {
    expect(passwordsMatchIssue('longenough', 'different')).toBe(
      'Passwords do not match.'
    )
    expect(passwordsMatchIssue('longenough', 'longenough')).toBeNull()
  })
})

describe('mapAuthError', () => {
  it('rewrites common Supabase sign-in and sign-up failures', () => {
    expect(mapAuthError('Invalid login credentials', 'signin')).toBe(
      'Email or password is incorrect.'
    )
    expect(mapAuthError('Email not confirmed', 'signin')).toBe(
      'Confirm your email first. Check your inbox and spam folder.'
    )
    expect(mapAuthError('User already registered', 'signup')).toBe(
      'An account with this email already exists. Sign in or reset your password.'
    )
    expect(
      mapAuthError('Password should be at least 6 characters', 'signup')
    ).toBe('Password must be at least 8 characters.')
  })

  it('keeps recovery failures generic', () => {
    expect(mapAuthError('Token has expired or is invalid', 'reset')).toBe(
      'This reset link is invalid or has expired.'
    )
    expect(mapAuthError('Auth session missing!', 'reset')).toBe(
      'This reset link is invalid or has expired.'
    )
  })

  it('does not leak unknown provider text', () => {
    expect(mapAuthError('weird_internal_jwt_blob', 'signin')).toBe(
      'Could not sign in. Check your email and password.'
    )
    expect(mapAuthError(null, 'confirm')).toBe(
      'Could not confirm your email. Request a new link or try signing in.'
    )
  })
})
