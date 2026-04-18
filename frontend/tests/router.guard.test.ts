import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppRouter } from '../src/router'
import { useAuthStore } from '../src/stores/authStore'

// Stub API and axios module — no network calls in tests
vi.mock('../src/api/auth', () => ({
  authApi: {
    me: vi.fn().mockRejectedValue(new Error('not authenticated')),
    logout: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('../src/api/axios', () => ({
  default: {},
  markRefreshFailed: vi.fn(),
  resetRefreshFailed: vi.fn(),
  shouldSkipRefresh: vi.fn().mockReturnValue(false),
}))

function makeRouter() {
  return createAppRouter()
}

describe('Router guard — requiresAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('redirects unauthenticated user from / to /login', async () => {
    const router = makeRouter()
    await router.push('/')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('Login')
  })

  it('redirects unauthenticated user from /episodes/:id/entry to /login', async () => {
    const router = makeRouter()
    await router.push('/episodes/some-id/entry')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('Login')
  })

  it('preserves the intended redirect path in query on redirect to /login', async () => {
    const router = makeRouter()
    await router.push('/candidates/abc-123')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('Login')
    expect(router.currentRoute.value.query.redirect).toBe('/candidates/abc-123')
  })

  it('allows authenticated user to access protected route', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.isReady = true
    authStore.role = 'User'

    const router = makeRouter()
    await router.push('/')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('allows authenticated user to access /candidates/:id', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.isReady = true
    authStore.role = 'User'

    const router = makeRouter()
    await router.push('/candidates/some-id')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('CandidateDetail')
  })

  it('allows unauthenticated user to access /login', async () => {
    const router = makeRouter()
    await router.push('/login')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('Login')
  })

  it('allows unauthenticated user to access /register', async () => {
    const router = makeRouter()
    await router.push('/register')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('Register')
  })

  it('waits for isReady before evaluating requiresAuth', async () => {
    const authStore = useAuthStore()
    // isReady starts false — guard must call fetchMe and set it before deciding
    expect(authStore.isReady).toBe(false)

    const router = makeRouter()
    await router.push('/login') // public route, guard still runs
    await router.isReady()

    // fetchMe() was called (authApi.me is mocked to reject), so isReady is now true
    expect(authStore.isReady).toBe(true)
  })
})

describe('Router guard — requiresAdmin', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('redirects non-admin authenticated user away from admin routes to dashboard', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.isReady = true
    authStore.role = 'User'

    const router = makeRouter()
    await router.push('/admin/seasons')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('redirects non-admin authenticated user away from /admin/users to dashboard', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.isReady = true
    authStore.role = 'User'

    const router = makeRouter()
    await router.push('/admin/users')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('Dashboard')
  })

  it('allows Administrator to access admin routes', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.isReady = true
    authStore.role = 'Administrator'

    const router = makeRouter()
    await router.push('/admin/seasons')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('AdminSeasons')
  })

  it('allows Administrator to access /admin/users', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.isReady = true
    authStore.role = 'Administrator'

    const router = makeRouter()
    await router.push('/admin/users')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('AdminUsers')
  })

  it('allows Administrator to access /admin/candidates', async () => {
    const authStore = useAuthStore()
    authStore.isAuthenticated = true
    authStore.isReady = true
    authStore.role = 'Administrator'

    const router = makeRouter()
    await router.push('/admin/candidates')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('AdminCandidates')
  })

  it('redirects unauthenticated user from admin route to /login (not dashboard)', async () => {
    const router = makeRouter()
    await router.push('/admin/seasons')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('Login')
  })
})
