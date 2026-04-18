<template>
  <v-card
    class="candidate-card"
    :class="{ 'candidate-card--eliminated': candidate.status === 'Eliminated' }"
    @click="$emit('click', candidate.candidateId)"
  >
    <!-- Photo -->
    <div class="candidate-card__photo">
      <v-img v-if="candidate.photoUrl" :src="candidate.photoUrl" cover height="120" />
      <div v-else class="candidate-card__photo-placeholder">
        <v-icon icon="mdi-account" size="48" color="onSurface" />
      </div>

      <!-- Returned badge overlaid on photo -->
      <div v-if="candidate.status === 'Returned'" class="candidate-card__returned-badge">
        <v-icon icon="mdi-undo-variant" size="14" />
        Returned
      </div>
    </div>

    <v-card-text class="pa-3">
      <!-- Name + rank -->
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="candidate-name text-body-2 font-weight-medium text-onBackground">
          {{ candidate.candidateName }}
        </span>
        <span class="rank-badge">#{{ rank }}</span>
      </div>

      <!-- Status + score -->
      <div class="d-flex align-center justify-space-between">
        <StatusBadge :status="candidate.status" />
        <span class="score-value" :style="{ color: scoreColor }">
          {{ candidate.score.toFixed(1) }}
        </span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import type { MoleScore } from '@/api/scores'
import { computed } from 'vue'
import { useScoreColor } from '@/composables/useMoleScore'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{
  candidate: MoleScore
  rank: number
  minScore: number
  maxScore: number
}>()

defineEmits<{
  click: [candidateId: string]
}>()

const { scoreColor: getScoreColor } = useScoreColor()

const scoreColor = computed(() =>
  getScoreColor(props.candidate.score, props.minScore, props.maxScore),
)
</script>

<style scoped>
.candidate-card {
  cursor: pointer;
  transition:
    border-color 0.15s,
    opacity 0.15s;
  height: 100%;
}

.candidate-card:hover {
  border-color: #3d3d3d;
}

.candidate-card--eliminated {
  opacity: 0.55;
}

.candidate-card__photo {
  position: relative;
}

.candidate-card__photo-placeholder {
  height: 120px;
  background: #242424;
  display: flex;
  align-items: center;
  justify-content: center;
}

.candidate-card__returned-badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  background: rgba(26, 46, 61, 0.92);
  color: #378add;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 3px;
}

.rank-badge {
  font-size: 12px;
  color: #c8c4be;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.score-value {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.candidate-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
