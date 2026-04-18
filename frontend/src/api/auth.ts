import api from './axios'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface MeResponse {
  userId: string
  name: string
  email: string
  role: 'User' | 'Administrator'
}

export const authApi = {
  login: (data: LoginRequest) => api.post<MeResponse>('/api/auth/login', data),

  register: (data: RegisterRequest) => api.post<MeResponse>('/api/auth/register', data),

  refresh: () => api.post('/api/auth/refresh'),

  logout: () => api.post('/api/auth/logout'),

  me: () => api.get<MeResponse>('/api/auth/me'),
}
