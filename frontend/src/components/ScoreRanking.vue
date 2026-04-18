<template>
  <div class="score-ranking">
    <p v-if="scores.length === 0" class="text-body-2 text-onSurface">No scores available yet.</p>

    <v-row v-else dense>
      <v-col
        v-for="candidate in ranked"
        :key="candidate.candidateId"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <CandidateCard
          :candidate="candidate"
          :rank="candidate.rank"
          :min-score="minScore"
          :max-score="maxScore"
          @click="$emit('select-candidate', $event)"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts" setup>
import type { MoleScore } from '@/api/scores'
import { useMoleScoreRanking } from '@/composables/useMoleScore'
import CandidateCard from './CandidateCard.vue'

const props = defineProps<{
  scores: MoleScore[]
}>()

defineEmits<{
  'select-candidate': [candidateId: string]
}>()

const { ranked, minScore, maxScore } = useMoleScoreRanking(() => props.scores)
</script>
