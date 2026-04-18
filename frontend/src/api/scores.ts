import type { ParticipationStatus } from './candidates'
import api from './axios'

export interface MoleScore {
  candidateId: string
  candidateName: string
  photoUrl: string | null
  status: ParticipationStatus
  totalMoneyEarned: number
  totalMoneyLost: number
  totalKeyPositions: number
  totalSuspiciousActs: number
  totalTimesAccused: number
  totalAccusedByEliminated: number
  score: number
  scorePerEpisode: number[]
}

export const scoresApi = {
  getActive: () => api.get<MoleScore[]>('/api/seasons/active/scores'),

  getBySeason: (seasonId: string) => api.get<MoleScore[]>(`/api/seasons/${seasonId}/scores`),

  getHistory: (seasonId: string) => api.get<MoleScore[]>(`/api/seasons/${seasonId}/scores/history`),
}
