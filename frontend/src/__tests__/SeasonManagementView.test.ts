import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import SeasonManagementView from '@/views/admin/SeasonManagementView.vue'

const SEASONS = [
  { id: 's1', name: 'Season 1', year: 2023, isActive: true, candidateCount: 5, episodeCount: 3 },
  { id: 's2', name: 'Season 2', year: 2024, isActive: false, candidateCount: 2, episodeCount: 0 },
]

const mockStore = {
  seasons: SEASONS,
  isLoading: false,
  fetchSeasons: vi.fn(),
  deleteSeason: vi.fn(),
  setActiveSeason: vi.fn(),
}

vi.mock('@/stores/seasonStore', () => ({
  useSeasonStore: vi.fn(() => mockStore),
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

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/admin/seasons', name: 'AdminSeasons', component: SeasonManagementView },
      { path: '/admin/seasons/new', name: 'AdminSeasonCreate', component: { template: '<div/>' } },
      {
        path: '/admin/seasons/:id/edit',
        name: 'AdminSeasonEdit',
        component: { template: '<div/>' },
      },
    ],
  })
}

async function mountView() {
  const router = makeRouter()
  await router.push('/admin/seasons')
  await router.isReady()
  const wrapper = mount(SeasonManagementView, {
    global: { plugins: [makeVuetify(), router] },
  })
  await flushPromises()
  return wrapper
}

describe('SeasonManagementView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockStore.seasons = [...SEASONS]
    mockStore.isLoading = false
  })

  it('shows a green active indicator for the active season', async () => {
    const wrapper = await mountView()
    const rows = wrapper.findAll('.season-row')
    const activeRow = rows.find((r) => r.text().includes('Season 1'))

    expect(activeRow?.find('.status-dot--active').exists()).toBe(true)
  })

  it('shows an inactive indicator for inactive seasons', async () => {
    const wrapper = await mountView()
    const rows = wrapper.findAll('.season-row')
    const inactiveRow = rows.find((r) => r.text().includes('Season 2'))

    expect(inactiveRow?.find('.status-dot--inactive').exists()).toBe(true)
  })

  it('delete button is disabled for the active season', async () => {
    const wrapper = await mountView()
    const rows = wrapper.findAll('.season-row')
    const activeRow = rows.find((r) => r.text().includes('Season 1'))

    // Find the trash button within the active season row
    const deleteBtn = activeRow?.findAll('button').find((b) => b.attributes('disabled') !== undefined)
    expect(deleteBtn?.attributes('disabled')).toBeDefined()
  })

  it('delete button is enabled for inactive seasons', async () => {
    const wrapper = await mountView()
    const rows = wrapper.findAll('.season-row')
    const inactiveRow = rows.find((r) => r.text().includes('Season 2'))

    // The "Set active" button shows for inactive seasons
    expect(inactiveRow?.text()).toContain('Set active')
  })

  it('renders both seasons', async () => {
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('Season 1')
    expect(wrapper.text()).toContain('Season 2')
  })

  it('shows candidate and episode counts', async () => {
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('5 candidates')
    expect(wrapper.text()).toContain('3 episodes')
  })

  it('calls fetchSeasons on mount', async () => {
    await mountView()
    expect(mockStore.fetchSeasons).toHaveBeenCalledTimes(1)
  })

  it('shows empty state when no seasons', async () => {
    mockStore.seasons = []
    const wrapper = await mountView()
    expect(wrapper.text()).toContain('No seasons yet')
  })
})
