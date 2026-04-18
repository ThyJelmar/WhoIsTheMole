import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createVuetify } from 'vuetify'
import RegisterView from '@/views/auth/RegisterView.vue'

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

function mountRegister() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/register', component: RegisterView },
      { path: '/', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
    ],
  })

  return mount(RegisterView, {
    global: {
      plugins: [vuetify, router],
    },
  })
}

describe('RegisterView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows validation errors when submitting empty form', async () => {
    const wrapper = mountRegister()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Name is required')
    expect(wrapper.text()).toContain('Email is required')
    expect(wrapper.text()).toContain('Password is required')
  })

  it('shows error when passwords do not match', async () => {
    const wrapper = mountRegister()

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('Alice')
    await inputs[1].setValue('alice@example.com')
    await inputs[2].setValue('password123')
    await inputs[3].setValue('different456')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Passwords do not match')
  })

  it('shows error when password is too short', async () => {
    const wrapper = mountRegister()

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('Alice')
    await inputs[1].setValue('alice@example.com')
    await inputs[2].setValue('short')
    await inputs[3].setValue('short')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Password must be at least 8 characters')
  })

  it('shows email conflict error on 409 response', async () => {
    const { authApi } = await import('@/api/auth')
    vi.mocked(authApi.register).mockRejectedValueOnce({ response: { status: 409 } })

    const wrapper = mountRegister()

    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('Alice')
    await inputs[1].setValue('alice@example.com')
    await inputs[2].setValue('password123')
    await inputs[3].setValue('password123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('This email address is already in use')
  })
})
