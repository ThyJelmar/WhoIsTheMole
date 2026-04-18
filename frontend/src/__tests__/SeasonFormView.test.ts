import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import SeasonFormView from '@/views/admin/SeasonFormView.vue'

const mockCreateSeason = vi.fn()
const mockUpdateSeason = vi.fn()

vi.mock('@/stores/seasonStore', () => ({
  useSeasonStore: vi.fn(() => ({
    createSeason: mockCreateSeason,
    updateSeason: mockUpdateSeason,
    fetchSeasons: vi.fn(),
  })),
}))

vi.mock('@/api/seasons', () => ({
  seasonsApi: {
    get: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getActive: vi.fn(),
    getWeights: vi.fn(),
    updateWeights: vi.fn(),
  },
}))

vi.mock('@/api/axios', () => ({
  default: {},
  markRefreshFailed: vi.fn(),
  resetRefreshFailed: vi.fn(),
  shouldSkipRefresh: vi.fn(),
}))

function makeVuetify() {
  return createVuetify({ components, directives })
}

function makeRouter(_path: string) {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/admin/seasons', name: 'AdminSeasons', component: { template: '<div/>' } },
      { path: '/admin/seasons/new', name: 'AdminSeasonCreate', component: SeasonFormView },
      {
        path: '/admin/seasons/:id/edit',
        name: 'AdminSeasonEdit',
        component: SeasonFormView,
      },
      {
        path: '/admin/seasons/:id/candidates',
        name: 'AdminSeasonCandidates',
        component: { template: '<div/>' },
      },
    ],
  })
}

async function mountCreate() {
  const router = makeRouter('/admin/seasons/new')
  await router.push('/admin/seasons/new')
  await router.isReady()
  const wrapper = mount(SeasonFormView, {
    global: { plugins: [makeVuetify(), router] },
  })
  await flushPromises()
  return { wrapper, router }
}

async function mountEdit(id = 'season-1') {
  const { seasonsApi } = await import('@/api/seasons')
  vi.mocked(seasonsApi.get).mockResolvedValueOnce({
    data: { id, name: 'Season 26 – Peru', year: 2024, isActive: false },
  } as never)

  const router = makeRouter(`/admin/seasons/${id}/edit`)
  await router.push(`/admin/seasons/${id}/edit`)
  await router.isReady()
  const wrapper = mount(SeasonFormView, {
    global: { plugins: [makeVuetify(), router] },
  })
  await flushPromises()
  return { wrapper, router }
}

describe('SeasonFormView — create mode', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows "New season" heading', async () => {
    const { wrapper } = await mountCreate()
    expect(wrapper.text()).toContain('New season')
  })

  it('shows validation error when name is empty on submit', async () => {
    const { wrapper } = await mountCreate()
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Season name is required')
  })

  it('submits correct payload on create', async () => {
    mockCreateSeason.mockResolvedValueOnce({ id: 'new-id', name: 'Test', year: 2025, isActive: false })
    const { wrapper } = await mountCreate()

    const inputs = wrapper.findAll('input')
    const nameInput = inputs.find((i) => i.attributes('type') !== 'checkbox')
    await nameInput?.setValue('Test Season')

    const yearInput = inputs.find((i) => i.attributes('type') === 'number')
    await yearInput?.setValue('2025')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockCreateSeason).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test Season', year: 2025 }),
    )
  })
})

describe('SeasonFormView — edit mode', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows "Edit season" heading', async () => {
    const { wrapper } = await mountEdit()
    expect(wrapper.text()).toContain('Edit season')
  })

  it('pre-fills name field with existing season name', async () => {
    const { wrapper } = await mountEdit()
    const nameInput = wrapper.findAll('input').find((i) => i.attributes('type') !== 'checkbox' && i.attributes('type') !== 'number')
    expect(nameInput?.element.value).toBe('Season 26 – Peru')
  })

  it('pre-fills year field with existing season year', async () => {
    const { wrapper } = await mountEdit()
    const yearInput = wrapper.findAll('input').find((i) => i.attributes('type') === 'number')
    expect(yearInput?.element.value).toBe('2024')
  })

  it('calls updateSeason with correct id on submit', async () => {
    mockUpdateSeason.mockResolvedValueOnce({ id: 'season-1', name: 'Updated', year: 2024, isActive: false })
    const { wrapper } = await mountEdit('season-1')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockUpdateSeason).toHaveBeenCalledWith('season-1', expect.objectContaining({ name: 'Season 26 – Peru' }))
  })
})
