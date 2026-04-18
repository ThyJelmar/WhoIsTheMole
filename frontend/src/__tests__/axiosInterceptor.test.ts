import { beforeEach, describe, expect, it } from 'vitest'
import {
  markRefreshFailed,
  resetRefreshFailed,
  shouldSkipRefresh,
  SKIP_REFRESH_ROUTES,
} from '@/api/axios'

describe('Axios interceptor — shouldSkipRefresh', () => {
  it('returns true for /api/auth/me', () => {
    expect(shouldSkipRefresh('/api/auth/me')).toBe(true)
  })

  it('returns true for /api/auth/refresh', () => {
    expect(shouldSkipRefresh('/api/auth/refresh')).toBe(true)
  })

  it('returns true for /api/auth/login', () => {
    expect(shouldSkipRefresh('/api/auth/login')).toBe(true)
  })

  it('returns true for /api/auth/logout', () => {
    expect(shouldSkipRefresh('/api/auth/logout')).toBe(true)
  })

  it('returns false for /api/seasons', () => {
    expect(shouldSkipRefresh('/api/seasons')).toBe(false)
  })

  it('returns false for /api/candidates/123', () => {
    expect(shouldSkipRefresh('/api/candidates/123')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(shouldSkipRefresh('')).toBe(false)
  })
})

describe('Axios interceptor — SKIP_REFRESH_ROUTES', () => {
  it('contains all required auth routes', () => {
    expect(SKIP_REFRESH_ROUTES).toContain('/api/auth/me')
    expect(SKIP_REFRESH_ROUTES).toContain('/api/auth/refresh')
    expect(SKIP_REFRESH_ROUTES).toContain('/api/auth/login')
    expect(SKIP_REFRESH_ROUTES).toContain('/api/auth/logout')
  })
})

describe('Axios interceptor — refresh state flags', () => {
  beforeEach(() => {
    resetRefreshFailed()
  })

  it('markRefreshFailed and resetRefreshFailed are callable without error', () => {
    expect(() => markRefreshFailed()).not.toThrow()
    expect(() => resetRefreshFailed()).not.toThrow()
  })
})
