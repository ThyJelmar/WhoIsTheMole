import type { MoleScore } from '@/api/scores'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMoleStore } from '@/stores/moleStore'

vi.mock('@/api/seasons', () => ({
  seasonsApi: {
    getActive: vi.fn().mockResolvedValue({
      data: { id: 'season-1', name: 'Season 1', year: 2024, isActive: true },
    }),
    list: vi.fn().mockResolvedValue({ data: [] }),
  },
}))

vi.mock('@/api/scores', () => ({
  scoresApi: {
    getBySeason: vi.fn().mockResolvedValue({
      data: [
        {
          candidateId: 'c1',
          candidateName: 'Alice',
          photoUrl: null,
          status: 'Active',
          totalMoneyEarned: 100,
          totalMoneyLost: 20,
          totalKeyPositions: 3,
          totalSuspiciousActs: 2,
          totalTimesAccused: 1,
          totalAccusedByEliminated: 0,
          score: 50,
          scorePerEpisode: [25, 25],
        },
        {
          candidateId: 'c2',
          candidateName: 'Bob',
          photoUrl: null,
          status: 'Active',
          totalMoneyEarned: 200,
          totalMoneyLost: 10,
          totalKeyPositions: 5,
          totalSuspiciousActs: 4,
          totalTimesAccused: 3,
          totalAccusedByEliminated: 1,
          score: 120,
          scorePerEpisode: [60, 60],
        },
        {
          candidateId: 'c3',
          candidateName: 'Charlie',
          photoUrl: null,
          status: 'Eliminated',
          totalMoneyEarned: 50,
          totalMoneyLost: 5,
          totalKeyPositions: 1,
          totalSuspiciousActs: 0,
          totalTimesAccused: 0,
          totalAccusedByEliminated: 0,
          score: 15,
          scorePerEpisode: [15, 0],
        },
      ] satisfies MoleScore[],
    }),
    getActive: vi.fn(),
    getHistory: vi.fn(),
  },
}))

describe('moleStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchDashboard sets scores sorted by score descending', async () => {
    const { seasonsApi } = await import('@/api/seasons')
    const { scoresApi } = await import('@/api/scores')
    vi.mocked(seasonsApi.getActive).mockResolvedValue({
      data: { id: 'season-1', name: 'Season 1', year: 2024, isActive: true },
    } as never)
    vi.mocked(scoresApi.getBySeason).mockResolvedValue({
      data: [
        {
          candidateId: 'c1',
          candidateName: 'Alice',
          score: 50,
          photoUrl: null,
          status: 'Active',
          totalMoneyEarned: 100,
          totalMoneyLost: 20,
          totalKeyPositions: 3,
          totalSuspiciousActs: 2,
          totalTimesAccused: 1,
          totalAccusedByEliminated: 0,
          scorePerEpisode: [25, 25],
        },
        {
          candidateId: 'c2',
          candidateName: 'Bob',
          score: 120,
          photoUrl: null,
          status: 'Active',
          totalMoneyEarned: 200,
          totalMoneyLost: 10,
          totalKeyPositions: 5,
          totalSuspiciousActs: 4,
          totalTimesAccused: 3,
          totalAccusedByEliminated: 1,
          scorePerEpisode: [60, 60],
        },
        {
          candidateId: 'c3',
          candidateName: 'Charlie',
          score: 15,
          photoUrl: null,
          status: 'Eliminated',
          totalMoneyEarned: 50,
          totalMoneyLost: 5,
          totalKeyPositions: 1,
          totalSuspiciousActs: 0,
          totalTimesAccused: 0,
          totalAccusedByEliminated: 0,
          scorePerEpisode: [15, 0],
        },
      ] as MoleScore[],
    } as never)

    const store = useMoleStore()
    await store.fetchDashboard()

    expect(store.scores).toHaveLength(3)
    expect(store.scores[0].candidateName).toBe('Bob') // 120
    expect(store.scores[1].candidateName).toBe('Alice') // 50
    expect(store.scores[2].candidateName).toBe('Charlie') // 15
  })

  it('fetchDashboard sets activeSeason', async () => {
    const { seasonsApi } = await import('@/api/seasons')
    const { scoresApi } = await import('@/api/scores')
    vi.mocked(seasonsApi.getActive).mockResolvedValue({
      data: { id: 'season-1', name: 'Season 1', year: 2024, isActive: true },
    } as never)
    vi.mocked(scoresApi.getBySeason).mockResolvedValue({ data: [] } as never)

    const store = useMoleStore()
    await store.fetchDashboard()

    expect(store.activeSeason?.id).toBe('season-1')
    expect(store.activeSeason?.name).toBe('Season 1')
  })

  it('fetchDashboard sets isLoading false after completion', async () => {
    const { seasonsApi } = await import('@/api/seasons')
    const { scoresApi } = await import('@/api/scores')
    vi.mocked(seasonsApi.getActive).mockResolvedValue({
      data: { id: 's1', name: 'S', year: 2024, isActive: true },
    } as never)
    vi.mocked(scoresApi.getBySeason).mockResolvedValue({ data: [] } as never)

    const store = useMoleStore()
    const promise = store.fetchDashboard()
    expect(store.isLoading).toBe(true)
    await promise
    expect(store.isLoading).toBe(false)
  })
})
