import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/authStore'

vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue({}),
    me: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
  },
}))

vi.mock('@/api/axios', () => ({
  default: {},
  markRefreshFailed: vi.fn(),
  resetRefreshFailed: vi.fn(),
  shouldSkipRefresh: vi.fn().mockReturnValue(false),
}))

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('logout clears user state', async () => {
    const store = useAuthStore()

    store.setSession({
      userId: '123',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'User',
    })

    expect(store.isAuthenticated).toBe(true)
    expect(store.name).toBe('Alice')

    await store.logout()

    expect(store.isAuthenticated).toBe(false)
    expect(store.userId).toBeNull()
    expect(store.name).toBeNull()
    expect(store.email).toBeNull()
    expect(store.role).toBeNull()
  })

  it('logout sets isReady to false', async () => {
    const store = useAuthStore()
    store.setSession({ userId: '1', name: 'Alice', email: 'a@b.com', role: 'User' })

    await store.logout()

    expect(store.isReady).toBe(false)
  })

  it('isAdmin returns true for Administrator role', () => {
    const store = useAuthStore()

    store.setSession({ userId: '1', name: 'Admin', email: 'a@b.com', role: 'Administrator' })

    expect(store.isAdmin).toBe(true)
  })

  it('isAdmin returns false for User role', () => {
    const store = useAuthStore()

    store.setSession({ userId: '1', name: 'User', email: 'u@b.com', role: 'User' })

    expect(store.isAdmin).toBe(false)
  })

  it('fetchMe sets session on success', async () => {
    const { authApi } = await import('@/api/auth')
    vi.mocked(authApi.me).mockResolvedValueOnce({
      data: { userId: '42', name: 'Bob', email: 'bob@example.com', role: 'User' },
    } as never)

    const store = useAuthStore()
    await store.fetchMe()

    expect(store.isAuthenticated).toBe(true)
    expect(store.name).toBe('Bob')
    expect(store.role).toBe('User')
  })

  it('fetchMe sets isReady to true on success', async () => {
    const { authApi } = await import('@/api/auth')
    vi.mocked(authApi.me).mockResolvedValueOnce({
      data: { userId: '42', name: 'Bob', email: 'bob@example.com', role: 'User' },
    } as never)

    const store = useAuthStore()
    expect(store.isReady).toBe(false)
    await store.fetchMe()
    expect(store.isReady).toBe(true)
  })

  it('fetchMe does not throw when /api/auth/me returns 401', async () => {
    const { authApi } = await import('@/api/auth')
    vi.mocked(authApi.me).mockRejectedValueOnce({ response: { status: 401 } })

    const store = useAuthStore()
    await expect(store.fetchMe()).resolves.toBeUndefined()
  })

  it('fetchMe sets isReady to true even on failure', async () => {
    const { authApi } = await import('@/api/auth')
    vi.mocked(authApi.me).mockRejectedValueOnce({ response: { status: 401 } })

    const store = useAuthStore()
    expect(store.isReady).toBe(false)
    await store.fetchMe()
    expect(store.isReady).toBe(true)
  })

  it('fetchMe sets isAuthenticated to false on failure', async () => {
    const { authApi } = await import('@/api/auth')
    vi.mocked(authApi.me).mockRejectedValueOnce(new Error('401'))

    const store = useAuthStore()
    await store.fetchMe()

    expect(store.isAuthenticated).toBe(false)
  })

  it('setSession sets isReady to true', () => {
    const store = useAuthStore()
    expect(store.isReady).toBe(false)
    store.setSession({ userId: '1', name: 'Alice', email: 'a@b.com', role: 'User' })
    expect(store.isReady).toBe(true)
  })
})
