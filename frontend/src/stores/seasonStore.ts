import type { Season } from '@/api/seasons'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { seasonsApi } from '@/api/seasons'

export const useSeasonStore = defineStore('seasons', () => {
  const seasons = ref<Season[]>([])
  const activeSeason = ref<Season | null>(null)
  const isLoading = ref(false)

  async function fetchSeasons() {
    isLoading.value = true
    try {
      const { data } = await seasonsApi.list()
      seasons.value = data
      activeSeason.value = data.find((s) => s.isActive) ?? null
    } finally {
      isLoading.value = false
    }
  }

  async function fetchActiveSeason() {
    const { data } = await seasonsApi.getActive()
    activeSeason.value = data
  }

  async function createSeason(data: Omit<Season, 'id' | 'candidateCount' | 'episodeCount'>) {
    const { data: season } = await seasonsApi.create(data)
    await fetchSeasons()
    return season
  }

  async function updateSeason(id: string, data: Partial<Season>) {
    const { data: season } = await seasonsApi.update(id, data)
    await fetchSeasons()
    return season
  }

  async function deleteSeason(id: string) {
    await seasonsApi.delete(id)
    await fetchSeasons()
  }

  async function setActiveSeason(id: string) {
    await seasonsApi.update(id, { isActive: true })
    await fetchSeasons()
  }

  return {
    seasons,
    activeSeason,
    isLoading,
    fetchSeasons,
    fetchActiveSeason,
    createSeason,
    updateSeason,
    deleteSeason,
    setActiveSeason,
  }
})
