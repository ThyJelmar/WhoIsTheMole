import type { MoleScore } from '@/api/scores'
import type { Season } from '@/api/seasons'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { seasonsApi } from '@/api/seasons'

export const useMoleStore = defineStore('mole', () => {
  const activeSeason = ref<Season | null>(null)
  const seasons = ref<Season[]>([])
  const scores = ref<MoleScore[]>([])
  const loadingScores = ref(false)

  async function loadSeasons() {
    const { data } = await seasonsApi.list()
    seasons.value = data
    activeSeason.value = data.find((s) => s.isActive) ?? data[0] ?? null
  }

  async function setActiveSeason(season: Season) {
    activeSeason.value = season
  }

  return {
    activeSeason,
    seasons,
    scores,
    loadingScores,
    loadSeasons,
    setActiveSeason,
  }
})
