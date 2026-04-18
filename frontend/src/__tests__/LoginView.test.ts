import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createVuetify } from 'vuetify'
import LoginView from '@/views/auth/LoginView.vue'

vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
  },
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    fetchMe: vi.fn(),
    isAuthenticated: false,
    isAdmin: false,
    name: null,
    email: null,
    role: null,
  }),
}))

const vuetify = createVuetify()

function mountLogin() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: LoginView },
      { path: '/', component: { template: '<div />' } },
      { path: '/register', component: { template: '<div />' } },
    ],
  })

  return mount(LoginView, {
    global: {
      plugins: [vuetify, router],
    },
  })
}

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows validation errors when submitting empty form', async () => {
    const wrapper = mountLogin()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Email is required')
    expect(wrapper.text()).toContain('Password is required')
  })

  it('shows error on 401 response', async () => {
    const { authApi } = await import('@/api/auth')
    vi.mocked(authApi.login).mockRejectedValueOnce({ response: { status: 401 } })

    const wrapper = mountLogin()

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Incorrect email or password')
  })

  it('shows generic error on non-401 failure', async () => {
    const { authApi } = await import('@/api/auth')
    vi.mocked(authApi.login).mockRejectedValueOnce({ response: { status: 500 } })

    const wrapper = mountLogin()

    await wrapper.find('input[type="email"]').setValue('test@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Something went wrong, try again')
  })
})
