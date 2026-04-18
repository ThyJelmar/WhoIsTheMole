import api from './axios'

export type ParticipationStatus = 'Active' | 'Eliminated' | 'Returned'

export interface Candidate {
  id: string
  seasonId: string
  name: string
  photoUrl: string | null
  description: string | null
  isActive: boolean
}

export interface CandidateParticipation {
  candidateId: string
  episodeId: string
  status: ParticipationStatus
}

export const candidatesApi = {
  listBySeason: (seasonId: string) => api.get<Candidate[]>(`/api/seasons/${seasonId}/candidates`),

  create: (seasonId: string, data: Pick<Candidate, 'name' | 'photoUrl' | 'description'>) =>
    api.post<Candidate>(`/api/seasons/${seasonId}/candidates`, data),

  get: (id: string) => api.get<Candidate>(`/api/candidates/${id}`),

  update: (id: string, data: Partial<Pick<Candidate, 'name' | 'photoUrl' | 'description'>>) =>
    api.put<Candidate>(`/api/candidates/${id}`, data),

  delete: (id: string) => api.delete(`/api/candidates/${id}`),

  updateParticipation: (id: string, data: CandidateParticipation) =>
    api.put(`/api/candidates/${id}/participation`, data),
}
