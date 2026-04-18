import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import DashboardView from '../src/views/user/DashboardView.vue'
import type { MoleScore } from '../src/api/scores'

// ── Mock the store APIs used by fetchDashboard ─────────────────────────────
vi.mock('../src/api/seasons', () => ({
  seasonsApi: {
    getActive: vi.fn(),
    list: vi.fn(),
  },
}))

vi.mock('../src/api/scores', () => ({
  scoresApi: {
    getBySeason: vi.fn(),
    getActive: vi.fn(),
    getHistory: vi.fn(),
  },
}))

import { seasonsApi } from '../src/api/seasons'
import { scoresApi } from '../src/api/scores'

const mockGetActive = seasonsApi.getActive as Mock
const mockGetBySeason = scoresApi.getBySeason as Mock

const SEASON = { id: 'season-1', name: 'Season 1', year: 2024, isActive: true }

// ── Fixtures ───────────────────────────────────────────────────────────────
const makeScore = (overrides: Partial<MoleScore> = {}): MoleScore => ({
  candidateId: 'cand-1',
  candidateName: 'Alice',
  photoUrl: null,
  status: 'Active',
  totalMoneyEarned: 100,
  totalMoneyLost: 50,
  totalKeyPositions: 2,
  totalSuspiciousActs: 1,
  totalTimesAccused: 3,
  totalAccusedByEliminated: 0,
  score: 80,
  scorePerEpisode: [40, 80],
  ...overrides,
})

const SCORES: MoleScore[] = [
  makeScore({ candidateId: 'cand-1', candidateName: 'Alice', score: 120, status: 'Active' }),
  makeScore({ candidateId: 'cand-2', candidateName: 'Bob', score: 60, status: 'Eliminated' }),
  makeScore({ candidateId: 'cand-3', candidateName: 'Charlie', score: 20, status: 'Returned' }),
]

// ── Test helpers ───────────────────────────────────────────────────────────
function makeVuetify() {
  return createVuetify({ components, directives })
}

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Dashboard', component: DashboardView },
      { path: '/candidates/:id', name: 'CandidateDetail', component: { template: '<div/>' } },
      { path: '/episodes', name: 'Episodes', component: { template: '<div/>' } },
      { path: '/login', name: 'Login', component: { template: '<div/>' } },
    ],
  })
}

async function mountDashboard() {
  const router = makeRouter()
  await router.push('/')
  await router.isReady()

  const wrapper = mount(DashboardView, {
    global: {
      plugins: [makeVuetify(), router],
    },
  })
  return { wrapper, router }
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('DashboardView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockGetActive.mockResolvedValue({ data: SEASON })
    mockGetBySeason.mockResolvedValue({ data: SCORES })
  })

  // ── Loading state ────────────────────────────────────────────────────────
  it('shows loading skeletons while the API call is in flight', async () => {
    mockGetActive.mockReturnValue(new Promise(() => {}))

    const { wrapper } = await mountDashboard()

    expect(wrapper.findAll('.v-skeleton-loader').length).toBeGreaterThan(0)
  })

  it('hides skeletons after loading completes', async () => {
    const { wrapper } = await mountDashboard()
    await flushPromises()

    expect(wrapper.findAll('.v-skeleton-loader').length).toBe(0)
  })

  // ── Success state ────────────────────────────────────────────────────────
  it('renders a CandidateCard for every score returned', async () => {
    const { wrapper } = await mountDashboard()
    await flushPromises()

    expect(wrapper.findAll('.candidate-row').length).toBe(SCORES.length)
  })

  it('displays each candidate name on screen', async () => {
    const { wrapper } = await mountDashboard()
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Alice')
    expect(text).toContain('Bob')
    expect(text).toContain('Charlie')
  })

  it('renders cards sorted descending by score', async () => {
    // Provide data in unsorted order — store should sort desc
    mockGetBySeason.mockResolvedValue({ data: [...SCORES].reverse() })

    const { wrapper } = await mountDashboard()
    await flushPromises()

    const cards = wrapper.findAll('.candidate-row')
    expect(cards[0].text()).toContain('Alice') // score 120
    expect(cards.at(-1)!.text()).toContain('Charlie') // score 20
  })

  it('shows rank #1 on the highest-scoring card', async () => {
    const { wrapper } = await mountDashboard()
    await flushPromises()

    const firstCard = wrapper.findAll('.candidate-row')[0]
    expect(firstCard.find('.rank-number').text()).toBe('#1')
  })

  it('applies the eliminated dimming class to eliminated candidates', async () => {
    const { wrapper } = await mountDashboard()
    await flushPromises()

    const eliminatedCard = wrapper.findAll('.candidate-row').find((c) => c.text().includes('Bob'))
    expect(eliminatedCard?.classes()).toContain('candidate-row--eliminated')
  })

  it('does not apply eliminated class to active candidates', async () => {
    const { wrapper } = await mountDashboard()
    await flushPromises()

    const activeCard = wrapper.findAll('.candidate-row').find((c) => c.text().includes('Alice'))
    expect(activeCard?.classes()).not.toContain('candidate-row--eliminated')
  })

  // ── Score color rules ────────────────────────────────────────────────────
  it('colors score > 100 hot red (#E84040)', async () => {
    const { wrapper } = await mountDashboard()
    await flushPromises()

    const firstCard = wrapper.findAll('.candidate-row')[0] // Alice score=120
    const scoreEl = firstCard.find('.score-value')
    expect(scoreEl.attributes('style')).toContain('#E84040')
  })

  it('colors score in 50-100 red (#CC1F1F)', async () => {
    const { wrapper } = await mountDashboard()
    await flushPromises()

    const bobCard = wrapper.findAll('.candidate-row').find((c) => c.text().includes('Bob'))!
    const scoreEl = bobCard.find('.score-value')
    expect(scoreEl.attributes('style')).toContain('#CC1F1F')
  })

  it('colors score in 10-49 amber (#EF9F27)', async () => {
    mockGetBySeason.mockResolvedValue({
      data: [makeScore({ score: 25 })],
    })

    const { wrapper } = await mountDashboard()
    await flushPromises()

    const scoreEl = wrapper.find('.score-value')
    expect(scoreEl.attributes('style')).toContain('#EF9F27')
  })

  it('colors score in -10..9 neutral (#C8C4BE)', async () => {
    mockGetBySeason.mockResolvedValue({ data: [makeScore({ score: 0 })] })

    const { wrapper } = await mountDashboard()
    await flushPromises()

    const scoreEl = wrapper.find('.score-value')
    expect(scoreEl.attributes('style')).toContain('#C8C4BE')
  })

  // ── Empty state ──────────────────────────────────────────────────────────
  it('shows the empty state when the API returns an empty array', async () => {
    mockGetBySeason.mockResolvedValue({ data: [] })

    const { wrapper } = await mountDashboard()
    await flushPromises()

    expect(wrapper.text()).toContain('No data yet')
    expect(wrapper.findAll('.candidate-row').length).toBe(0)
  })

  // ── Navigation ───────────────────────────────────────────────────────────
  it('navigates to CandidateDetail when a card is clicked', async () => {
    const { wrapper, router } = await mountDashboard()
    await flushPromises()

    const firstCard = wrapper.find('.candidate-row')
    await firstCard.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('CandidateDetail')
    expect(router.currentRoute.value.params.id).toBe('cand-1')
  })

  // ── API contract ─────────────────────────────────────────────────────────
  it('calls seasonsApi.getActive() exactly once on mount', async () => {
    await mountDashboard()
    await flushPromises()

    expect(mockGetActive).toHaveBeenCalledTimes(1)
  })

  it('calls seasonsApi.getActive() again when refresh is clicked', async () => {
    const { wrapper } = await mountDashboard()
    await flushPromises()

    const refreshBtn = wrapper.find('[aria-label="Refresh scores"]')
    await refreshBtn.trigger('click')
    await flushPromises()

    expect(mockGetActive).toHaveBeenCalledTimes(2)
  })
})
