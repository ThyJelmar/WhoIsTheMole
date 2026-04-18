<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-medium text-onBackground">Mole Scores</h1>
        <p class="text-body-2 mt-1" style="color: #c8c4be">
          Your ranking — sorted by suspicion score
        </p>
      </div>
      <v-btn
        v-if="!loading"
        icon="mdi-refresh"
        variant="text"
        color="onSurface"
        size="small"
        :aria-label="'Refresh scores'"
        @click="load"
      />
    </div>

    <!-- Loading skeleton -->
    <template v-if="loading">
      <v-row dense>
        <v-col v-for="n in 6" :key="n" cols="12" sm="6" md="4" lg="3">
          <v-skeleton-loader type="image, list-item-two-line" color="surfaceVariant" />
        </v-col>
      </v-row>
    </template>

    <!-- Error -->
    <v-alert v-else-if="error" type="error" variant="tonal" :text="error" class="mb-4">
      <template #append>
        <v-btn variant="text" size="small" @click="load">Retry</v-btn>
      </template>
    </v-alert>

    <!-- Empty state (no active season yet) -->
    <div v-else-if="scores.length === 0" class="empty-state">
      <v-icon icon="mdi-eye-off-outline" size="48" color="onSurface" class="mb-3" />
      <p class="text-body-1 text-onSurface">No scores yet.</p>
      <p class="text-body-2 mt-1" style="color: #c8c4be">
        Start filling in episode entries to see your mole ranking.
      </p>
    </div>

    <!-- Score ranking -->
    <ScoreRanking v-else :scores="scores" @select-candidate="navigateToCandidate" />
  </div>
</template>

<script lang="ts" setup>
import type { MoleScore } from '@/api/scores'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { scoresApi } from '@/api/scores'
import ScoreRanking from '@/components/ScoreRanking.vue'

const router = useRouter()

const scores = ref<MoleScore[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const { data } = await scoresApi.getActive()
    scores.value = data
  } catch (error_: unknown) {
    error.value = error_ instanceof Error ? error_.message : 'Failed to load scores. Please try again.'
  } finally {
    loading.value = false
  }
}

function navigateToCandidate(candidateId: string) {
  router.push({ name: 'CandidateDetail', params: { id: candidateId } })
}

onMounted(load)
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}
</style>
