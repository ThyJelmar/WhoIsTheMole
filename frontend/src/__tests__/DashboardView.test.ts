import type { MoleScore } from '@/api/scores'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createVuetify } from 'vuetify'
import DashboardView from '@/views/user/DashboardView.vue'

const vuetify = createVuetify()

function makeScore(id: string, name: string, score: number): MoleScore {
  return {
    candidateId: id,
    candidateName: name,
    photoUrl: null,
    status: 'Active',
    totalMoneyEarned: 100,
    totalMoneyLost: 10,
    totalKeyPositions: 2,
    totalSuspiciousActs: 1,
    totalTimesAccused: 3,
    totalAccusedByEliminated: 0,
    score,
    scorePerEpisode: [score],
  }
}

vi.mock('@/stores/moleStore', () => ({
  useMoleStore: vi.fn(),
}))

function mountDashboard() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Dashboard', component: DashboardView },
      { path: '/episodes', name: 'Episodes', component: { template: '<div />' } },
      { path: '/candidates/:id', name: 'CandidateDetail', component: { template: '<div />' } },
    ],
  })
  return mount(DashboardView, {
    global: { plugins: [vuetify, router] },
  })
}

describe('DashboardView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows skeleton while loading', async () => {
    const { useMoleStore } = await import('@/stores/moleStore')
    vi.mocked(useMoleStore).mockReturnValue({
      isLoading: true,
      scores: [],
      activeSeason: null,
      fetchDashboard: vi.fn(),
    } as never)

    const wrapper = mountDashboard()
    expect(wrapper.findAll('.v-skeleton-loader').length).toBeGreaterThan(0)
  })

  it('renders one CandidateCard per score entry', async () => {
    const { useMoleStore } = await import('@/stores/moleStore')
    const scores = [
      makeScore('c1', 'Alice', 100),
      makeScore('c2', 'Bob', 50),
      makeScore('c3', 'Charlie', 25),
    ]
    vi.mocked(useMoleStore).mockReturnValue({
      isLoading: false,
      scores,
      activeSeason: { id: 's1', name: 'Season 1', year: 2024, isActive: true },
      fetchDashboard: vi.fn(),
    } as never)

    const wrapper = mountDashboard()
    await flushPromises()

    const cards = wrapper.findAll('.candidate-row')
    expect(cards).toHaveLength(3)
  })

  it('shows empty state when scores array is empty', async () => {
    const { useMoleStore } = await import('@/stores/moleStore')
    vi.mocked(useMoleStore).mockReturnValue({
      isLoading: false,
      scores: [],
      activeSeason: { id: 's1', name: 'Season 1', year: 2024, isActive: true },
      fetchDashboard: vi.fn(),
    } as never)

    const wrapper = mountDashboard()
    await flushPromises()

    expect(wrapper.text()).toContain('No data yet')
  })
})
