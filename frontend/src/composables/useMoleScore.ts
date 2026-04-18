import type { MoleScore } from '@/api/scores'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export type ScoreLevel = 'high' | 'neutral' | 'low'

export function absoluteScoreColor(score: number): string {
  if (score > 100) return '#E84040'
  if (score >= 50) return '#CC1F1F'
  if (score >= 10) return '#EF9F27'
  if (score >= -10) return '#C8C4BE'
  return '#378ADD'
}

// Score color thresholds — bottom third = innocent (blue), top third = suspicious (red)
const HIGH_THRESHOLD = 0.66
const LOW_THRESHOLD = 0.33

export function useScoreColor() {
  function scoreColor(score: number, min: number, max: number): string {
    if (max === min) return '#C8C4BE'
    const ratio = (score - min) / (max - min)
    if (ratio >= HIGH_THRESHOLD) return '#CC1F1F'
    if (ratio <= LOW_THRESHOLD) return '#378ADD'
    return '#C8C4BE'
  }

  function scoreLevel(score: number, min: number, max: number): ScoreLevel {
    if (max === min) return 'neutral'
    const ratio = (score - min) / (max - min)
    if (ratio >= HIGH_THRESHOLD) return 'high'
    if (ratio <= LOW_THRESHOLD) return 'low'
    return 'neutral'
  }

  return { scoreColor, scoreLevel }
}

/**
 * Accepts a reactive or plain array of MoleScores.
 * Returns computed ranked list (descending) and computed min/max scores.
 */
export function useMoleScoreRanking(scores: MaybeRefOrGetter<MoleScore[]>) {
  const ranked = computed(() => {
    const list = toValue(scores)
    return list.toSorted((a, b) => b.score - a.score).map((s, i) => ({ ...s, rank: i + 1 }))
  })

  const minScore = computed(() => {
    const list = toValue(scores)
    return list.length > 0 ? Math.min(...list.map((s) => s.score)) : 0
  })

  const maxScore = computed(() => {
    const list = toValue(scores)
    return list.length > 0 ? Math.max(...list.map((s) => s.score)) : 0
  })

  return { ranked, minScore, maxScore }
}
