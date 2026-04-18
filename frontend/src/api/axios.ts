import axios from 'axios'

export const SKIP_REFRESH_ROUTES = [
  '/api/auth/me',
  '/api/auth/refresh',
  '/api/auth/login',
  '/api/auth/logout',
]

export function shouldSkipRefresh(url: string): boolean {
  return SKIP_REFRESH_ROUTES.some((route) => url.includes(route))
}

const api = axios.create({
  baseURL: 'https://localhost:7296',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let refreshFailed = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

export function markRefreshFailed(): void {
  refreshFailed = true
}

export function resetRefreshFailed(): void {
  refreshFailed = false
}

function processQueue(error: unknown) {
  for (const { resolve, reject } of failedQueue) {
    if (error) reject(error)
    else resolve(undefined)
  }
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url = (error.config?.url ?? '') as string

    // Never attempt refresh for auth routes or after a failed refresh
    if (shouldSkipRefresh(url) || refreshFailed) {
      throw error
    }

    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry) {
      throw error
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(() => api(originalRequest))
        .catch((error_) => {
          throw error_
        })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      await axios.post('https://localhost:7296/api/auth/refresh', {}, { withCredentials: true })
      processQueue(null)
      return api(originalRequest)
    } catch (refreshError) {
      refreshFailed = true
      processQueue(refreshError)
      window.location.href = '/login'
      throw refreshError
    } finally {
      isRefreshing = false
    }
  },
)

export default api
