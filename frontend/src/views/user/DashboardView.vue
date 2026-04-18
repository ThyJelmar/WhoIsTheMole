<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-medium text-onBackground">Mole Scores</h1>
        <p class="text-body-2 mt-1" style="color: #c8c4be">
          {{ moleStore.activeSeason?.name ?? 'Active season' }} — sorted by suspicion score
        </p>
      </div>
      <v-btn
        v-if="!moleStore.isLoading"
        icon="mdi-refresh"
        variant="text"
        color="onSurface"
        size="small"
        aria-label="Refresh scores"
        @click="moleStore.fetchDashboard()"
      />
    </div>

    <!-- Loading skeleton -->
    <template v-if="moleStore.isLoading">
      <v-row dense class="mb-6">
        <v-col v-for="n in 3" :key="n" cols="12" sm="4">
          <v-skeleton-loader type="list-item-two-line" color="surfaceVariant" />
        </v-col>
      </v-row>
      <v-skeleton-loader
        v-for="n in 5"
        :key="n"
        type="list-item-avatar-two-line"
        color="surfaceVariant"
        class="mb-2"
      />
    </template>

    <!-- Loaded content -->
    <template v-else>
      <!-- Stat cards -->
      <v-row dense class="mb-6">
        <v-col cols="12" sm="4">
          <div class="stat-card">
            <div class="stat-label">Episodes entered</div>
            <div class="stat-value">{{ episodesEntered }}</div>
          </div>
        </v-col>
        <v-col cols="12" sm="4">
          <div class="stat-card">
            <div class="stat-label">Active candidates</div>
            <div class="stat-value">{{ activeCandidates }}</div>
          </div>
        </v-col>
        <v-col cols="12" sm="4">
          <div class="stat-card">
            <div class="stat-label">Top suspect</div>
            <div class="stat-value stat-value--name">{{ topSuspect }}</div>
          </div>
        </v-col>
      </v-row>

      <!-- Empty state -->
      <div v-if="moleStore.scores.length === 0" class="empty-state">
        <v-icon icon="mdi-eye-off-outline" size="48" color="onSurface" class="mb-3" />
        <p class="text-body-1 text-onSurface mb-2">No data yet. Start by entering episode data.</p>
        <v-btn :to="{ path: '/episodes' }" color="primary" variant="tonal" size="small">
          Go to Episodes
        </v-btn>
      </div>

      <!-- Ranking list -->
      <div v-else>
        <CandidateCard
          v-for="(candidate, index) in moleStore.scores"
          :key="candidate.candidateId"
          :candidate="candidate"
          :rank="index + 1"
          :max-score="maxScore"
        />
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import CandidateCard from '@/components/CandidateCard.vue'
import { useMoleStore } from '@/stores/moleStore'

const moleStore = useMoleStore()

const episodesEntered = computed(() => moleStore.scores[0]?.scorePerEpisode.length ?? 0)

const activeCandidates = computed(
  () => moleStore.scores.filter((s) => s.status === 'Active').length,
)

const topSuspect = computed(() => moleStore.scores[0]?.candidateName ?? '—')

const maxScore = computed(() => {
  if (moleStore.scores.length === 0) return 0
  return Math.max(...moleStore.scores.map((s) => s.score))
})

onMounted(() => {
  moleStore.fetchDashboard()
})
</script>

<style scoped>
.stat-card {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 16px 20px;
}

.stat-label {
  font-size: 12px;
  color: #c8c4be;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #f0ede8;
  font-variant-numeric: tabular-nums;
}

.stat-value--name {
  font-size: 18px;
  font-weight: 500;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}
</style>
