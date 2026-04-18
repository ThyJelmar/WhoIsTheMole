import api from './axios'

export interface Assignment {
  id: string
  episodeId: string
  number: number
  description: string | null
  maxAmount: number | null
  note: string | null
}

export interface Episode {
  id: string
  seasonId: string
  number: number
  title: string | null
  assignments: Assignment[]
}

export const episodesApi = {
  listBySeason: (seasonId: string) => api.get<Episode[]>(`/api/seasons/${seasonId}/episodes`),

  create: (seasonId: string, data: Pick<Episode, 'number' | 'title'>) =>
    api.post<Episode>(`/api/seasons/${seasonId}/episodes`, data),

  get: (id: string) => api.get<Episode>(`/api/episodes/${id}`),

  update: (id: string, data: Partial<Pick<Episode, 'number' | 'title'>>) =>
    api.put<Episode>(`/api/episodes/${id}`, data),

  delete: (id: string) => api.delete(`/api/episodes/${id}`),
}

export const assignmentsApi = {
  listByEpisode: (episodeId: string) =>
    api.get<Assignment[]>(`/api/episodes/${episodeId}/assignments`),

  create: (episodeId: string, data: Omit<Assignment, 'id' | 'episodeId'>) =>
    api.post<Assignment>(`/api/episodes/${episodeId}/assignments`, data),

  get: (id: string) => api.get<Assignment>(`/api/assignments/${id}`),

  update: (id: string, data: Partial<Omit<Assignment, 'id' | 'episodeId'>>) =>
    api.put<Assignment>(`/api/assignments/${id}`, data),

  delete: (id: string) => api.delete(`/api/assignments/${id}`),
}
