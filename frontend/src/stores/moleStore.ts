import type { MoleScore } from '@/api/scores'
import type { Season } from '@/api/seasons'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { scoresApi } from '@/api/scores'
import { seasonsApi } from '@/api/seasons'

export const useMoleStore = defineStore('mole', () => {
  const activeSeason = ref<Season | null>(null)
  const seasons = ref<Season[]>([])
  const scores = ref<MoleScore[]>([])
  const isLoading = ref(false)

  async function fetchDashboard() {
    isLoading.value = true
    try {
      const { data: season } = await seasonsApi.getActive()
      activeSeason.value = season
      const { data: rawScores } = await scoresApi.getBySeason(season.id)
      scores.value = rawScores.toSorted((a, b) => b.score - a.score)
    } finally {
      isLoading.value = false
    }
  }

  async function loadSeasons() {
    const { data } = await seasonsApi.list()
    seasons.value = data
    activeSeason.value = data.find((s) => s.isActive) ?? data[0] ?? null
  }

  function setActiveSeason(season: Season) {
    activeSeason.value = season
  }

  return {
    activeSeason,
    seasons,
    scores,
    isLoading,
    fetchDashboard,
    loadSeasons,
    setActiveSeason,
  }
})
