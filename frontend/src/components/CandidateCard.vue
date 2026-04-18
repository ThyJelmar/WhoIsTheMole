<template>
  <div
    class="candidate-row"
    :class="{ 'candidate-row--eliminated': candidate.status === 'Eliminated' }"
    @click="handleClick"
  >
    <!-- Rank -->
    <div class="rank-col">
      <span class="rank-number">#{{ rank }}</span>
    </div>

    <!-- Avatar -->
    <div class="avatar-col">
      <img
        v-if="candidate.photoUrl"
        :src="candidate.photoUrl"
        class="avatar-img"
        :alt="candidate.candidateName"
      />
      <div v-else class="avatar-circle">{{ initials }}</div>
    </div>

    <!-- Info -->
    <div class="info-col">
      <div class="candidate-name">{{ candidate.candidateName }}</div>
      <div class="candidate-subtitle">
        {{ candidate.totalTimesAccused }}× accused &middot; {{ candidate.totalKeyPositions }} key
        positions
      </div>
    </div>

    <!-- Score + bar -->
    <div class="score-col">
      <div class="score-value" :style="{ color: scoreColor }">
        {{ candidate.score.toFixed(1) }}
      </div>
      <div class="score-bar-track">
        <div class="score-bar-fill" :style="{ width: barWidth + '%', background: scoreColor }" />
      </div>
    </div>

    <!-- Status -->
    <div class="status-col">
      <StatusBadge :status="candidate.status" />
      <span v-if="candidate.status === 'Returned'" class="return-icon">↩</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { MoleScore } from '@/api/scores'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { absoluteScoreColor } from '@/composables/useMoleScore'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{
  candidate: MoleScore
  rank: number
  maxScore: number
}>()

const router = useRouter()

const scoreColor = computed(() => absoluteScoreColor(props.candidate.score))

const initials = computed(() => {
  const parts = props.candidate.candidateName.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts.at(-1)![0]).toUpperCase()
    : props.candidate.candidateName.slice(0, 2).toUpperCase()
})

const barWidth = computed(() => {
  if (props.maxScore <= 0) return 0
  const pct = (props.candidate.score / props.maxScore) * 100
  return Math.max(0, Math.min(100, pct))
})

function handleClick() {
  router.push({ name: 'CandidateDetail', params: { id: props.candidate.candidateId } })
}
</script>

<style scoped>
.candidate-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background: #1a1a1a;
  border: 1px solid #2e2e2e;
  cursor: pointer;
  transition:
    border-color 0.15s,
    opacity 0.15s;
  margin-bottom: 6px;
}

.candidate-row:hover {
  border-color: #3d3d3d;
}

.candidate-row--eliminated {
  opacity: 0.5;
}

.rank-col {
  width: 32px;
  flex-shrink: 0;
}

.rank-number {
  font-size: 13px;
  color: #c8c4be;
  font-variant-numeric: tabular-nums;
}

.avatar-col {
  flex-shrink: 0;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #2e2e2e;
  color: #c8c4be;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.info-col {
  flex: 1;
  min-width: 0;
}

.candidate-name {
  font-size: 14px;
  font-weight: 500;
  color: #f0ede8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.candidate-subtitle {
  font-size: 12px;
  color: #c8c4be;
  margin-top: 2px;
}

.score-col {
  flex-shrink: 0;
  width: 80px;
  text-align: right;
}

.score-value {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.score-bar-track {
  margin-top: 4px;
  height: 4px;
  background: #2e2e2e;
  border-radius: 2px;
  overflow: hidden;
}

.score-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

.status-col {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.return-icon {
  font-size: 14px;
  color: #378add;
}
</style>
