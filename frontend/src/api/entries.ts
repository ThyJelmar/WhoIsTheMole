import api from './axios'

export interface Suspicion {
  suspectedCandidateId: string
  rank: number
}

export interface EpisodeEntry {
  id: string
  episodeId: string
  candidateId: string
  userId: string
  moneyEarned: number | null
  moneyLost: number | null
  keyPositions: number | null
  suspiciousActs: number | null
  note: string | null
  suspicions: Suspicion[]
}

export interface AssignmentEntry {
  id: string
  assignmentId: string
  candidateId: string
  userId: string
  moneyEarned: number | null
  moneyLost: number | null
  note: string | null
}

export type EpisodeEntryInput = Omit<EpisodeEntry, 'id' | 'userId'>
export type AssignmentEntryInput = Omit<AssignmentEntry, 'id' | 'userId'>

export const entriesApi = {
  getEpisodeEntries: (episodeId: string) =>
    api.get<EpisodeEntry[]>(`/api/episodes/${episodeId}/entries`),

  saveEpisodeEntry: (episodeId: string, candidateId: string, data: EpisodeEntryInput) =>
    api.put<EpisodeEntry>(`/api/episodes/${episodeId}/entries/${candidateId}`, data),

  getAssignmentEntries: (assignmentId: string) =>
    api.get<AssignmentEntry[]>(`/api/assignments/${assignmentId}/entries`),

  saveAssignmentEntry: (assignmentId: string, candidateId: string, data: AssignmentEntryInput) =>
    api.put<AssignmentEntry>(`/api/assignments/${assignmentId}/entries/${candidateId}`, data),
}
