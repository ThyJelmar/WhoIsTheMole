import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSeasonStore } from '@/stores/seasonStore'

vi.mock('@/api/seasons', () => ({
  seasonsApi: {
    list: vi.fn(),
    getActive: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/api/axios', () => ({
  default: {},
  markRefreshFailed: vi.fn(),
  resetRefreshFailed: vi.fn(),
  shouldSkipRefresh: vi.fn().mockReturnValue(false),
}))

const SEASONS = [
  { id: 's1', name: 'Season 1', year: 2023, isActive: true, candidateCount: 5, episodeCount: 3 },
  { id: 's2', name: 'Season 2', year: 2024, isActive: false, candidateCount: 2, episodeCount: 0 },
]

describe('seasonStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchSeasons populates seasons and sets activeSeason', async () => {
    const { seasonsApi } = await import('@/api/seasons')
    vi.mocked(seasonsApi.list).mockResolvedValueOnce({ data: SEASONS } as never)

    const store = useSeasonStore()
    await store.fetchSeasons()

    expect(store.seasons).toHaveLength(2)
    expect(store.activeSeason?.id).toBe('s1')
  })

  it('fetchSeasons sets isLoading to false after completion', async () => {
    const { seasonsApi } = await import('@/api/seasons')
    vi.mocked(seasonsApi.list).mockResolvedValueOnce({ data: SEASONS } as never)

    const store = useSeasonStore()
    await store.fetchSeasons()

    expect(store.isLoading).toBe(false)
  })

  it('setActiveSeason calls update with isActive:true and refreshes list', async () => {
    const { seasonsApi } = await import('@/api/seasons')
    vi.mocked(seasonsApi.update).mockResolvedValueOnce({ data: SEASONS[1] } as never)
    vi.mocked(seasonsApi.list).mockResolvedValueOnce({ data: SEASONS } as never)

    const store = useSeasonStore()
    await store.setActiveSeason('s2')

    expect(seasonsApi.update).toHaveBeenCalledWith('s2', { isActive: true })
    expect(seasonsApi.list).toHaveBeenCalledTimes(1)
  })

  it('deleteSeason calls delete and refreshes list', async () => {
    const { seasonsApi } = await import('@/api/seasons')
    vi.mocked(seasonsApi.delete).mockResolvedValueOnce(undefined as never)
    vi.mocked(seasonsApi.list).mockResolvedValueOnce({ data: [SEASONS[0]] } as never)

    const store = useSeasonStore()
    await store.deleteSeason('s2')

    expect(seasonsApi.delete).toHaveBeenCalledWith('s2')
    expect(seasonsApi.list).toHaveBeenCalledTimes(1)
  })

  it('createSeason calls create and refreshes list', async () => {
    const { seasonsApi } = await import('@/api/seasons')
    const newSeason = { id: 's3', name: 'Season 3', year: 2025, isActive: false }
    vi.mocked(seasonsApi.create).mockResolvedValueOnce({ data: newSeason } as never)
    vi.mocked(seasonsApi.list).mockResolvedValueOnce({ data: [...SEASONS, newSeason] } as never)

    const store = useSeasonStore()
    const result = await store.createSeason({ name: 'Season 3', year: 2025, isActive: false })

    expect(result.id).toBe('s3')
    expect(seasonsApi.list).toHaveBeenCalledTimes(1)
  })
})
