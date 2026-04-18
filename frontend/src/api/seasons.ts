import api from './axios'

export interface Season {
  id: string
  name: string
  year: number
  isActive: boolean
}

export interface ScoreWeights {
  moneyEarnedWeight: number
  moneyLostWeight: number
  keyPositionWeight: number
  suspiciousActWeight: number
  timesAccusedWeight: number
  accusedByEliminatedWeight: number
}

export const seasonsApi = {
  list: () => api.get<Season[]>('/api/seasons'),

  get: (id: string) => api.get<Season>(`/api/seasons/${id}`),

  create: (data: Omit<Season, 'id'>) => api.post<Season>('/api/seasons', data),

  update: (id: string, data: Partial<Season>) => api.put<Season>(`/api/seasons/${id}`, data),

  delete: (id: string) => api.delete(`/api/seasons/${id}`),

  getWeights: (id: string) => api.get<ScoreWeights>(`/api/seasons/${id}/weights`),

  updateWeights: (id: string, data: ScoreWeights) =>
    api.put<ScoreWeights>(`/api/seasons/${id}/weights`, data),
}
